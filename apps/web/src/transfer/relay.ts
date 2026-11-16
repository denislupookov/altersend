import b4a from 'b4a'
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

const DEFAULT_RELAYS = ['wss://relay.altersend.com', 'wss://relay-sg.altersend.com']

export function relayUrls(): string[] {
  const configured = import.meta.env.VITE_RELAY_URL as string | undefined
  if (configured)
    return configured
      .split(',')
      .map((url) => url.trim())
      .filter(Boolean)
  return DEFAULT_RELAYS
}

interface RelayEntry {
  url: string
  socket: WebSocket
}

function connectionId(): string {
  const bytes = new Uint8Array(16)
  crypto.getRandomValues(bytes)
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('')
}

function fastestRelay(urls: string[], cid: string): Promise<RelayEntry> {
  return new Promise((resolve, reject) => {
    const entries = urls.map((url) => ({
      url,
      socket: new WebSocket(`${url.replace(/\/$/, '')}/?cid=${cid}`)
    }))
    if (entries.length === 0) {
      reject(new Error('relayUnreachable'))
      return
    }

    let failed = 0
    const timer = setTimeout(() => settle(null), RELAY_TIMEOUT_MS)

    function settle(winner: RelayEntry | null) {
      clearTimeout(timer)
      for (const entry of entries) {
        entry.socket.onopen = entry.socket.onerror = null
        if (entry !== winner) entry.socket.close()
      }
      if (winner) resolve(winner)
      else reject(new Error('relayUnreachable'))
    }

    for (const entry of entries) {
      entry.socket.onopen = () => settle(entry)
      entry.socket.onerror = () => {
        failed += 1
        if (failed === entries.length) settle(null)
      }
    }
  })
}

const sleep = (ms: number): Promise<void> => new Promise((r) => setTimeout(r, ms))

function withTimeout<T>(promise: Promise<T>, ms: number, code: ConnectErrorCode): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(code)), ms)
    promise.then(resolve, reject).finally(() => clearTimeout(timer))
  })
}

export async function openRelay(
  urls: string[]
): Promise<{ dht: RelayDHT; teardown: () => void; url: string; cid: string }> {
  const cid = connectionId()
  const { socket, url } = await fastestRelay(urls, cid)
  const dht = new DHT(new Stream(true, socket), { custodial: false }) as unknown as RelayDHT
  let torn = false
  return {
    dht,
    url,
    cid,
    teardown: () => {
      if (torn) return
      torn = true
      dht.destroy?.().catch((err) => console.warn('Failed to destroy relay DHT', err))
      socket.close()
    }
  }
}

export async function fetchRelayLimit(wsUrl: string, cid?: string): Promise<number | null> {
  try {
    const base = wsUrl.replace(/^ws/, 'http')
    const url = new URL('/limits.json', base)
    if (cid) url.searchParams.set('cid', cid)
    const res = await fetch(url, { signal: AbortSignal.timeout(3000) })
    if (!res.ok) return null
    const data = (await res.json()) as { maxTransferBytes?: unknown }
    const bytes = Number(data.maxTransferBytes)
    return Number.isFinite(bytes) && bytes > 0 ? bytes : null
  } catch {
    return null
  }
}

export function relayReady(dht: RelayDHT): Promise<void> {
  return withTimeout(dht.ready(), RELAY_TIMEOUT_MS, 'relayUnreachable')
}

export async function findPeers(dht: RelayDHT, discovery: Uint8Array): Promise<Peer[]> {
  for (let attempt = 0; attempt < LOOKUP_ATTEMPTS; attempt++) {
    const peers = await new Promise<Peer[]>((resolve) => {
      const query = dht.lookup(discovery)
      const found = new Map<string, Peer>()
      query.on('data', (res) => {
        for (const peer of res.peers ?? []) found.set(b4a.toString(peer.publicKey, 'hex'), peer)
      })
      query.on('close', () => resolve([...found.values()]))
      query.on('error', () => resolve([...found.values()]))
    })
    if (peers.length > 0) return peers
    await sleep(LOOKUP_INTERVAL_MS)
  }
  return []
}
