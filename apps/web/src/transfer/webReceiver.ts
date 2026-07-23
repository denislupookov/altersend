import './sodium-patch'
import DHT from '@hyperswarm/dht-relay'
import Stream from '@hyperswarm/dht-relay/ws'
import b4a from 'b4a'
import crypto from 'hypercore-crypto'
import { ReceiverSession } from '@altersend/drive'
import {
  createPeerProtocol,
  type FileOffer,
  type PeerProtocol,
  type TextOffer,
  type TransferReady
} from './peerProtocol'
import { MemorySink, saveToDisk } from './downloadSink'

const LOOKUP_ATTEMPTS = 15
const LOOKUP_INTERVAL_MS = 1000
const OFFER_TIMEOUT_MS = 30000
const RELAY_TIMEOUT_MS = 15000

const CONNECT_ERROR_CODES = ['relayUnreachable', 'senderNotFound', 'nothingShared'] as const

export type ConnectErrorCode = (typeof CONNECT_ERROR_CODES)[number]

export type ConnectStage = 'relay' | 'finding' | 'waiting' | 'preparing'

export function connectErrorCode(error: unknown): ConnectErrorCode | null {
  const message = error instanceof Error ? error.message : ''
  return CONNECT_ERROR_CODES.find((code) => code === message) ?? null
}

export interface ConnectHandlers {
  onStatus?: (stage: ConnectStage) => void
}

interface DownloadHandlers {
  onProgress?: (received: number, total: number) => void
  onDone?: (savedAs: string, size: number) => void
  onError?: (message: string) => void
}

export interface Connection {
  offers: FileOffer[]
  texts: TextOffer[]
  download: (offer: FileOffer, handlers: DownloadHandlers) => Promise<void>
  pause: (offerId: string) => void
  close: () => void
}

interface FileTransfer {
  sink: MemorySink
  bits?: Uint8Array
  receiver?: { cancel: (reason?: string) => void }
  paused: boolean
}

interface Peer {
  publicKey: Uint8Array
}

interface RelayDHT {
  ready(): Promise<void>
  destroy?(): Promise<void>
  lookup(discovery: Uint8Array): {
    on(event: 'data', cb: (res: { peers?: Peer[] }) => void): void
    on(event: 'close' | 'error', cb: () => void): void
  }
  connect(publicKey: Uint8Array): {
    on(event: 'open', cb: () => void): void
    on(event: 'error', cb: (err: Error) => void): void
  }
}

function relayUrl(): string {
  const configured = import.meta.env.VITE_RELAY_URL as string | undefined
  if (configured) return configured
  const scheme = location.protocol === 'https:' ? 'wss' : 'ws'
  return `${scheme}://${location.hostname}:8080`
}

const sleep = (ms: number): Promise<void> => new Promise((r) => setTimeout(r, ms))

function withTimeout<T>(promise: Promise<T>, ms: number, code: ConnectErrorCode): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(code)), ms)
    promise.then(resolve, reject).finally(() => clearTimeout(timer))
  })
}

async function findPeer(dht: RelayDHT, discovery: Uint8Array): Promise<Peer | null> {
  for (let attempt = 0; attempt < LOOKUP_ATTEMPTS; attempt++) {
    const peer = await new Promise<Peer | null>((resolve) => {
      const query = dht.lookup(discovery)
      let found: Peer | null = null
      query.on('data', (res) => {
        if (!found && res.peers?.length) found = res.peers[0]
      })
      query.on('close', () => resolve(found))
      query.on('error', () => resolve(null))
    })
    if (peer) return peer
    await sleep(LOOKUP_INTERVAL_MS)
  }
  return null
}

const fileRef = (offer: FileOffer) => ({
  transferId: offer.transferId,
  fileId: offer.id,
  fileName: offer.name
})

function downloadOffer(
  proto: PeerProtocol,
  transfers: Map<string, FileTransfer>,
  offer: FileOffer,
  handlers: DownloadHandlers
): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    const existing = transfers.get(offer.id)
    const state: FileTransfer = existing ?? { sink: new MemorySink(), paused: false }
    state.paused = false
    transfers.set(offer.id, state)

    const channel = proto.driveSession(offer.id)

    const receiver = new ReceiverSession(state.sink, channel, {
      transferId: offer.id,
      expectedSize: offer.size,
      resumeBits: state.bits,
      onChunkWritten: (bitmap) => {
        state.bits = bitmap.serialize()
      },
      onProgress: (received, total) => {
        handlers.onProgress?.(received, total)
        proto.sendControl({
          type: 'download-progress',
          ...fileRef(offer),
          bytesTransferred: received,
          totalBytes: total
        })
      }
    })
    state.receiver = receiver

    proto.sendControl({
      type: 'download-request',
      ...fileRef(offer),
      path: offer.name,
      totalBytes: offer.size
    })

    receiver
      .receive()
      .then(() => {
        saveToDisk(state.sink.bytes, offer.name)
        proto.sendControl({ type: 'download-complete', ...fileRef(offer), savedTo: offer.name })
        handlers.onDone?.(offer.name, state.sink.bytes.length)
        transfers.delete(offer.id)
        channel.close()
        resolve()
      })
      .catch((err: Error) => {
        channel.close()
        if (state.paused) {
          resolve()
          return
        }
        proto.sendControl({ type: 'download-failed', ...fileRef(offer), message: err.message })
        handlers.onError?.(err.message)
        reject(err)
      })
  })
}

export async function connect(code: string, handlers: ConnectHandlers): Promise<Connection> {
  handlers.onStatus?.('relay')

  const ws = new WebSocket(relayUrl())
  const dht = new DHT(new Stream(true, ws), { custodial: false }) as unknown as RelayDHT

  const teardown = () => {
    dht.destroy?.().catch((err) => console.warn('Failed to destroy relay DHT', err))
    ws.close()
  }

  try {
    await withTimeout(dht.ready(), RELAY_TIMEOUT_MS, 'relayUnreachable')

    const topic = b4a.from(code.trim(), 'hex')
    const discovery = crypto.discoveryKey(topic)

    handlers.onStatus?.('finding')
    const peer = await findPeer(dht, discovery)
    if (!peer) throw new Error('senderNotFound')

    return await waitForOffers(dht, peer, teardown, handlers)
  } catch (err) {
    teardown()
    throw err
  }
}

function waitForOffers(
  dht: RelayDHT,
  peer: Peer,
  teardown: () => void,
  handlers: ConnectHandlers
): Promise<Connection> {
  const conn = dht.connect(peer.publicKey)

  return new Promise<Connection>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('nothingShared')), OFFER_TIMEOUT_MS)

    conn.on('error', (err: Error) => {
      clearTimeout(timer)
      reject(err)
    })

    conn.on('open', () => {
      handlers.onStatus?.('waiting')
      let settled = false

      const proto = createPeerProtocol(conn, (message) => {
        if (message.type === 'transfer-start') {
          handlers.onStatus?.('preparing')
          return
        }
        if (message.type !== 'transfer-ready' || settled) return

        const shared = (message as TransferReady).files
        const offers = shared.filter((f): f is FileOffer => f.kind === 'file')
        const texts = shared.filter((f): f is TextOffer => f.kind === 'text')
        if (offers.length === 0 && texts.length === 0) return

        settled = true
        clearTimeout(timer)
        const transfers = new Map<string, FileTransfer>()

        resolve({
          offers,
          texts,
          download: (offer, dh) => downloadOffer(proto, transfers, offer, dh),
          pause: (offerId) => {
            const state = transfers.get(offerId)
            if (!state?.receiver) return
            state.paused = true
            state.receiver.cancel('Paused')
          },
          close: () => {
            for (const state of transfers.values()) {
              state.paused = true
              state.receiver?.cancel('Closed')
            }
            transfers.clear()
            teardown()
          }
        })
      })
    })
  })
}
