import { topicProof } from '@altersend/core/topic-auth'
import {
  createPeerProtocol,
  type FileOffer,
  type TextOffer,
  type TransferReady
} from './peerProtocol'
import { downloadOffer, type FileTransfer } from './fileDownload'
import type { ConnectHandlers, Connection, Peer, RelayDHT } from './types'

const OFFER_TIMEOUT_MS = 30000

interface WebRelayConnection {
  cid: string
  host: string
}

export function waitForOffers(
  dht: RelayDHT,
  peer: Peer,
  topicHex: string,
  teardown: () => void,
  handlers: ConnectHandlers,
  relay: WebRelayConnection
): Promise<Connection> {
  const conn = dht.connect(peer.publicKey)
  const transfers = new Map<string, FileTransfer>()
  let settled = false

  const onDrop = () => {
    for (const state of transfers.values()) {
      state.paused = true
      state.receiver?.cancel('Sender disconnected')
    }
    teardown()
    handlers.onClosed?.()
  }

  return new Promise<Connection>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('nothingShared')), OFFER_TIMEOUT_MS)

    conn.on('error', (err: Error) => {
      if (settled) return onDrop()
      clearTimeout(timer)
      reject(err)
    })

    conn.on('close', () => {
      if (settled) return onDrop()
      clearTimeout(timer)
      reject(new Error('senderNotFound'))
    })

    conn.on('open', () => {
      handlers.onStatus?.('waiting')

      const proto = createPeerProtocol(conn, (message) => {
        if (message.type === 'challenge') {
          const nonce = (message as { nonce?: string }).nonce
          if (nonce) proto.sendControl({ type: 'auth', proof: topicProof(topicHex, nonce) })
          proto.sendControl({ type: 'web-relay', cid: relay.cid, host: relay.host })
          return
        }
        if (message.type === 'transfer-start') {
          handlers.onStatus?.('preparing')
          return
        }
        if (message.type !== 'transfer-ready' || settled) return

        const shared = (message as TransferReady).files
        if (!Array.isArray(shared)) return
        const offers = shared.filter((f): f is FileOffer => f?.kind === 'file')
        const texts = shared.filter((f): f is TextOffer => f?.kind === 'text')
        if (offers.length === 0 && texts.length === 0) return

        settled = true
        clearTimeout(timer)

        resolve({
          offers,
          texts,
          download: (offer, dh, toOpfs) => downloadOffer(proto, transfers, offer, dh, toOpfs),
          close: () => {
            for (const state of transfers.values()) {
              state.paused = true
              state.receiver?.cancel('Closed')
              state.sink
                .discard()
                .catch((error) => console.warn('Failed to discard partial', error))
            }
            transfers.clear()
            teardown()
          }
        })
      })

      proto.sendControl({ type: 'hello', client: 'web' })
    })
  })
}
