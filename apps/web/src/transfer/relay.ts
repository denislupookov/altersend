import DHT from '@hyperswarm/dht-relay'
import Stream from '@hyperswarm/dht-relay/ws'
import { CONNECT_ERROR_CODES, type ConnectErrorCode, type Peer, type RelayDHT } from './types'

const LOOKUP_ATTEMPTS = 15
const LOOKUP_INTERVAL_MS = 1000
const RELAY_TIMEOUT_MS = 15000

export function connectErrorCode(error: unknown): ConnectErrorCode | null {
  const message = error instanceof Error ? error.message : ''
  return CONNECT_ERROR_CODES.find((code) => code === message) ?? null
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

export function openRelay(): { dht: RelayDHT; teardown: () => void } {
  const ws = new WebSocket(relayUrl())
  const dht = new DHT(new Stream(true, ws), { custodial: false }) as unknown as RelayDHT
  return {
    dht,
    teardown: () => {
      dht.destroy?.().catch((err) => console.warn('Failed to destroy relay DHT', err))
      ws.close()
    }
  }
}

export function relayReady(dht: RelayDHT): Promise<void> {
  return withTimeout(dht.ready(), RELAY_TIMEOUT_MS, 'relayUnreachable')
}

export async function findPeer(dht: RelayDHT, discovery: Uint8Array): Promise<Peer | null> {
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
