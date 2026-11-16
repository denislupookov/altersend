import Protomux from 'protomux'
import c from 'compact-encoding'
import { isRelayKey, proTokenFor } from './config'
import { watchDialOpen, type DialSocket } from '../transfer/connect-progress'
import { reportRelayBusy, watchRelayStatus } from './status'

const PROTOCOL = 'altersend-pro'

export function announceProToken(
  socket: unknown,
  token: string,
  cid: string | null = null
): boolean {
  try {
    const mux = Protomux.from(socket)
    const channel = mux.createChannel({ protocol: PROTOCOL })
    if (!channel) return false

    const message = channel.addMessage<string>({ encoding: c.string })
    channel.open()
    message.send(JSON.stringify({ token, cid }))
    return true
  } catch {
    return false
  }
}

interface DialTarget {
  connect(publicKey: Uint8Array, opts?: unknown): unknown
}

export interface RelayDialHooks {
  onAllRelaysBusy(): void
  onPeerDial(socket: DialSocket): void
  onRelayDial(): void
}

const attached = new WeakSet<DialTarget>()

export function attachRelayDial(dht: DialTarget, hooks: RelayDialHooks): void {
  if (attached.has(dht)) return
  attached.add(dht)

  const connect = dht.connect.bind(dht)
  dht.connect = (publicKey: Uint8Array, opts?: unknown) => {
    const socket = connect(publicKey, opts) as DialSocket
    if (!isRelayKey(publicKey)) {
      hooks.onPeerDial(socket)
      return socket
    }

    const token = proTokenFor(publicKey)
    if (token) announceProToken(socket, token)
    watchRelayStatus(socket, publicKey, hooks.onAllRelaysBusy)
    watchDialOpen(socket, () => reportRelayBusy(publicKey, hooks.onAllRelaysBusy))
    hooks.onRelayDial()
    return socket
  }
}
