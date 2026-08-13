import DHT from 'hyperdht'

let shared: DHT | null = null
let leases = 0

export function acquireDht(): DHT {
  if (!shared) shared = new DHT()
  leases++
  return shared
}

export function releaseDht(): Promise<void> {
  leases = Math.max(0, leases - 1)
  if (leases > 0 || !shared) return Promise.resolve()

  const dht = shared
  shared = null
  return dht.destroy().catch(() => undefined)
}
