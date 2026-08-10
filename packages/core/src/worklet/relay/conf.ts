import b4a from 'b4a'
import DHT from 'hyperdht'
import { configureRelay, registerRelayLoader, relayConfigSummary } from './config'
import { isValidHexKey } from '../transfer/utils'

const MAX_ATTEMPTS = 3
const RETRY_DELAY_MS = 5000

let pubkey: Uint8Array | null = null
let loaded = false
let inFlight = false
let activeDht: DHT | null = null

export function startRelayConf(pubkeyHex: string | undefined): void {
  if (!pubkeyHex || pubkey) return

  pubkey = b4a.from(pubkeyHex, 'hex')
  registerRelayLoader(() => ensureRelayConf())

  if (relayConfigSummary().enabled) ensureRelayConf()
}

interface RelayRecordEntry {
  key: string
  host: string
  utc?: number
}

function recordUtcOffset(entry: RelayRecordEntry): number | undefined {
  if (typeof entry.utc === 'number' && Number.isFinite(entry.utc)) return entry.utc
  return undefined
}

function isValidEntry(entry: unknown): entry is RelayRecordEntry {
  const e = entry as Partial<RelayRecordEntry> | null
  return (
    !!e &&
    typeof e === 'object' &&
    isValidHexKey(e.key) &&
    typeof e.host === 'string' &&
    e.host.length > 0
  )
}

const delay = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms))

const READY_TIMEOUT_MS = 8000

let readyResolve: (() => void) | null = null
let readyPromise: Promise<void> | null = null

function settleReady(): void {
  readyResolve?.()
  readyResolve = null
}

export function whenRelayConfReady(timeoutMs = READY_TIMEOUT_MS): Promise<void> {
  if (loaded || !pubkey || !relayConfigSummary().enabled) return Promise.resolve()
  if (!readyPromise) {
    readyPromise = new Promise<void>((resolve) => {
      readyResolve = resolve
    })
  }
  return Promise.race([readyPromise, delay(timeoutMs)])
}

async function ensureRelayConf(): Promise<void> {
  if (!pubkey || loaded || inFlight || !relayConfigSummary().enabled) return

  inFlight = true
  const dht = new DHT()
  activeDht = dht

  try {
    for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
      if (activeDht !== dht) return
      if (await tryFetch(dht)) {
        loaded = true
        return
      }
      if (attempt < MAX_ATTEMPTS - 1) await delay(RETRY_DELAY_MS)
    }
    console.warn('[relay-conf] no relays configured, hole-punch only')
  } finally {
    activeDht = null
    inFlight = false
    settleReady()
    try {
      await dht.destroy()
    } catch (err) {
      console.warn(
        '[relay-conf] dht.destroy failed',
        err instanceof Error ? err.message : String(err)
      )
    }
  }
}

async function tryFetch(dht: DHT): Promise<boolean> {
  if (!pubkey) return false

  try {
    const record = await dht.mutableGet(pubkey, { latest: true })
    if (!record?.value) return false
    const parsed = JSON.parse(b4a.toString(record.value, 'utf8')) as {
      relays?: unknown
      web?: unknown
    }
    if (
      Array.isArray(parsed.relays) &&
      parsed.relays.length > 0 &&
      parsed.relays.every(isValidEntry)
    ) {
      const relays = parsed.relays as RelayRecordEntry[]
      const web = Array.isArray(parsed.web) ? parsed.web.filter(isValidEntry) : []
      configureRelay({
        relays: relays.map((r) => ({ keyHex: r.key, host: r.host, utcOffset: recordUtcOffset(r) })),
        webRelays: web.map((r) => ({ keyHex: r.key, host: r.host }))
      })
      return true
    }
  } catch (err) {
    console.warn('[relay-conf] fetch failed', err instanceof Error ? err.message : String(err))
  }

  return false
}

export async function stopRelayConf(): Promise<void> {
  const dht = activeDht
  activeDht = null

  if (dht) {
    try {
      await dht.destroy()
    } catch (err) {
      console.warn(
        '[relay-conf] dht.destroy failed',
        err instanceof Error ? err.message : String(err)
      )
    }
  }
}
