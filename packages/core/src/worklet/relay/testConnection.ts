import { firstCustomRelayKey } from './config'
import { whenRelayConfReady } from './conf'
import { acquireDht, releaseDht } from './dht'
import type { TestCustomRelayReply } from '../rpc/protocol'

const TIMEOUT_MS = 10000

interface Dialable {
  connect(publicKey: Uint8Array, opts?: unknown): DialSocket
}

interface DialSocket {
  once(event: string, handler: (arg?: unknown) => void): void
  destroy(): void
}

export async function testCustomRelayConnection(): Promise<TestCustomRelayReply> {
  if (!firstCustomRelayKey()) await whenRelayConfReady()

  const key = firstCustomRelayKey()
  if (!key) return { ok: false }

  const dht = acquireDht() as unknown as Dialable
  const started = Date.now()

  try {
    await new Promise<void>((resolve, reject) => {
      const socket = dht.connect(key)
      const timer = setTimeout(() => {
        socket.destroy()
        reject(new Error('timeout'))
      }, TIMEOUT_MS)
      socket.once('open', () => {
        clearTimeout(timer)
        socket.destroy()
        resolve()
      })
      socket.once('error', (err) => {
        clearTimeout(timer)
        reject(err instanceof Error ? err : new Error(String(err)))
      })
    })
    return { ok: true, ms: Date.now() - started }
  } catch {
    return { ok: false }
  } finally {
    await releaseDht()
  }
}
