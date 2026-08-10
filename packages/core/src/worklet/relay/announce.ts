import Protomux from 'protomux'
import c from 'compact-encoding'
import { proTokenFor } from './config'

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

const attached = new WeakSet<DialTarget>()

export function attachProAnnounce(dht: DialTarget): void {
  if (attached.has(dht)) return
  attached.add(dht)

  const connect = dht.connect.bind(dht)
  dht.connect = (publicKey: Uint8Array, opts?: unknown) => {
    const socket = connect(publicKey, opts)
    const token = proTokenFor(publicKey)
    if (token) announceProToken(socket, token)
    return socket
  }
}
