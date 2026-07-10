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
  } finally {
    activeDht = null
    inFlight = false
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
    const parsed = JSON.parse(b4a.toString(record.value, 'utf8')) as { relays?: unknown }
    if (
      Array.isArray(parsed.relays) &&
      parsed.relays.length > 0 &&
      parsed.relays.every(isValidEntry)
    ) {
      const relays = parsed.relays as RelayRecordEntry[]
      configureRelay({ relays: relays.map((r) => ({ keyHex: r.key, host: r.host })) })
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
