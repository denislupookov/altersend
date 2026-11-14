import { acquireDht, releaseDht } from './dht'
import type { NetworkCheckReply } from '../rpc/protocol'

const TIMEOUT_MS = 12000

interface NatProbe {
  fullyBootstrapped(): Promise<void>
  randomized: boolean
  host: string | null
}

function bootstrapWithin(dht: NatProbe, ms: number): Promise<boolean> {
  let timer: ReturnType<typeof setTimeout> | null = null
  const timeout = new Promise<boolean>((resolve) => {
    timer = setTimeout(() => resolve(false), ms)
  })
  const ready = dht.fullyBootstrapped().then(
    () => true,
    () => false
  )
  return Promise.race([ready, timeout]).finally(() => {
    if (timer) clearTimeout(timer)
  })
}

export async function checkNetwork(): Promise<NetworkCheckReply> {
  const dht = acquireDht() as unknown as NatProbe
  try {
    const ready = await bootstrapWithin(dht, TIMEOUT_MS)
    if (!ready || dht.host === null) return { status: 'offline' }
    return { status: dht.randomized ? 'limited' : 'direct' }
  } finally {
    await releaseDht()
  }
}
