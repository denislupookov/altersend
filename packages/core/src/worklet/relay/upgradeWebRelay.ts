import DHT from 'hyperdht'
import { announceProToken } from './announce'
import { proToken, webRelayKeyForHost } from './config'

const SETTLE_MS = 1500

interface Dialable {
  connect(publicKey: Uint8Array, opts?: unknown): unknown
  destroy(): Promise<void>
}

interface Closable {
  destroy(): void
}

export async function upgradeWebRelay(cid: string, host: string): Promise<boolean> {
  const token = proToken()
  const key = webRelayKeyForHost(host)
  if (!token || !key) return false

  const dht = new DHT() as unknown as Dialable

  try {
    const socket = dht.connect(key) as Closable
    const announced = announceProToken(socket, token, cid)

    if (announced) {
      await new Promise((resolve) => setTimeout(resolve, SETTLE_MS))
    }

    socket.destroy()
    return announced
  } catch {
    return false
  } finally {
    await dht.destroy().catch((err) => {
      console.warn('[pro] upgrade dht destroy failed', err instanceof Error ? err.message : err)
    })
  }
}
