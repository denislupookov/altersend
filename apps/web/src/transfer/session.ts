import b4a from 'b4a'
import crypto from 'hypercore-crypto'
import { TOPIC_AUTH_VERSION, topicProof } from '@altersend/core/topic-auth'
import {
  createPeerProtocol,
  type FileOffer,
  type TextOffer,
  type TransferReady
} from './peerProtocol'
import { downloadOffer, type FileTransfer } from './fileDownload'
import type { ConnectHandlers, Connection, Peer, RelayDHT } from './types'

const OFFER_TIMEOUT_MS = 30000
const SENDER_AUTH_TIMEOUT_MS = 10000

interface WebRelayConnection {
  cid: string
  host: string
}

interface AuthMessage {
  nonce?: unknown
  proof?: unknown
  authVersion?: unknown
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
  const nonce = b4a.toString(crypto.randomBytes(32), 'hex')
  let senderVerified = false
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
    const timers: ReturnType<typeof setTimeout>[] = []

    const fail = (code: string) => {
      for (const timer of timers) clearTimeout(timer)
      reject(new Error(code))
      conn.destroy()
    }

    timers.push(setTimeout(() => fail('nothingShared'), OFFER_TIMEOUT_MS))

    conn.on('error', (err: Error) => {
      if (settled) return onDrop()
      for (const timer of timers) clearTimeout(timer)
      reject(err)
    })

    conn.on('close', () => {
      if (settled) return onDrop()
      for (const timer of timers) clearTimeout(timer)
      reject(new Error('senderNotFound'))
    })

    conn.on('open', () => {
      handlers.onStatus?.('waiting')
      const handshakeHash = conn.handshakeHash
      if (!handshakeHash) return fail('senderNotFound')

      timers.push(
        setTimeout(() => {
          if (!senderVerified) fail('senderNotFound')
        }, SENDER_AUTH_TIMEOUT_MS)
      )

      const proto = createPeerProtocol(conn, (message) => {
        if (message.type === 'challenge') {
          const { nonce: theirNonce, authVersion } = message as AuthMessage
          if (authVersion !== TOPIC_AUTH_VERSION || typeof theirNonce !== 'string') return
          proto.sendControl({
            type: 'auth',
            authVersion: TOPIC_AUTH_VERSION,
            proof: topicProof(topicHex, theirNonce, handshakeHash, 'receiver')
          })
          return
        }
        if (message.type === 'auth') {
          if (senderVerified) return
          const { proof, authVersion } = message as AuthMessage
          if (authVersion !== TOPIC_AUTH_VERSION) return
          if (proof !== topicProof(topicHex, nonce, handshakeHash, 'sender')) {
            return fail('senderNotFound')
          }
          senderVerified = true
          proto.sendControl({ type: 'web-relay', cid: relay.cid, host: relay.host })
          return
        }
        if (!senderVerified) return
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
        for (const timer of timers) clearTimeout(timer)

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
      proto.sendControl({ type: 'challenge', nonce, authVersion: TOPIC_AUTH_VERSION })
    })
  })
}
