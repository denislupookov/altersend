import b4a from 'b4a'
import type DHT from 'hyperdht'
import { acquireDht, releaseDht } from './dht'
import { configureRelay, registerRelayLoader, relayConfigSummary } from './config'
import { isValidHexKey } from '../transfer/utils'
import type { CustomRelayInput } from '../rpc/protocol'

const MAX_ATTEMPTS = 3
const RETRY_DELAY_MS = 5000
const READY_TIMEOUT_MS = 8000

interface RelayRecordEntry {
  key: string
  host: string
  utc?: number
}

function toRelayInput(entry: RelayRecordEntry) {
  const utc = typeof entry.utc === 'number' && Number.isFinite(entry.utc) ? entry.utc : undefined
  return { keyHex: entry.key, host: entry.host, utcOffset: utc }
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

type ApplyRecord = (relays: RelayRecordEntry[], web: RelayRecordEntry[]) => void

interface ConfSource {
  ensure(): void
  stop(): Promise<void>
  pending(): Promise<void> | null
}

function createConfSource(pubkeyHex: string, label: string, apply: ApplyRecord): ConfSource {
  const pubkey = b4a.from(pubkeyHex, 'hex')
  let loaded = false
  let stopped = false
  let running: Promise<void> | null = null
  let holdsLease = false

  const warnUnresolved = () => console.warn(`[relay-conf] ${label}: no relays resolved`)

  async function tryFetch(dht: DHT): Promise<boolean> {
    try {
      const record = await dht.mutableGet(pubkey, { latest: true })
      if (stopped) return false
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
        const web = Array.isArray(parsed.web) ? parsed.web.filter(isValidEntry) : []
        apply(parsed.relays as RelayRecordEntry[], web)
        return true
      }
    } catch {
      return false
    }

    return false
  }

  async function run(): Promise<void> {
    try {
      const dht = acquireDht()
      holdsLease = true

      for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
        if (stopped) return
        if (await tryFetch(dht)) {
          loaded = true
          return
        }
        if (attempt < MAX_ATTEMPTS - 1) await delay(RETRY_DELAY_MS)
      }
      warnUnresolved()
    } finally {
      if (holdsLease) {
        holdsLease = false
        await releaseDht()
      }
    }
  }

  return {
    ensure: () => {
      if (loaded || running || stopped) return
      running = run()
        .catch(warnUnresolved)
        .finally(() => {
          running = null
        })
    },
    stop: () => {
      stopped = true
      if (!holdsLease) return Promise.resolve()
      holdsLease = false
      return releaseDht()
    },
    pending: () => running
  }
}

let official: ConfSource | null = null
let customOrg: ConfSource | null = null

registerRelayLoader(() => {
  official?.ensure()
  customOrg?.ensure()
})

export function startRelayConf(pubkeyHex: string | undefined): void {
  if (!pubkeyHex || official) return

  official = createConfSource(pubkeyHex, 'official', (relays, web) => {
    configureRelay({
      relays: relays.map(toRelayInput),
      webRelays: web.map((r) => ({ keyHex: r.key, host: r.host }))
    })
  })

  if (relayConfigSummary().enabled) official.ensure()
}

export function applyCustomRelay(input: CustomRelayInput | null): void {
  customOrg?.stop()
  customOrg = null

  const valid = !!input && isValidHexKey(input.keyHex)

  if (valid && input.kind === 'relay') {
    configureRelay({
      customRelays: [{ keyHex: input.keyHex, host: input.host }],
      customConfigured: true
    })
    return
  }

  if (valid && input.kind === 'org') {
    configureRelay({ customRelays: [], customConfigured: true })
    customOrg = createConfSource(input.keyHex, 'custom', (relays) => {
      configureRelay({ customRelays: relays.map(toRelayInput) })
    })
    if (relayConfigSummary().enabled) customOrg.ensure()
    return
  }

  configureRelay({ customRelays: [], customConfigured: false })
}

export function whenRelayConfReady(timeoutMs = READY_TIMEOUT_MS): Promise<void> {
  if (!relayConfigSummary().enabled) return Promise.resolve()

  const waits = [official?.pending(), customOrg?.pending()].filter(
    (wait): wait is Promise<void> => !!wait
  )
  if (waits.length === 0) return Promise.resolve()

  let timer: ReturnType<typeof setTimeout> | null = null
  const timeout = new Promise<void>((resolve) => {
    timer = setTimeout(resolve, timeoutMs)
  })

  return Promise.race([Promise.all(waits).then(() => undefined), timeout]).finally(() => {
    if (timer) clearTimeout(timer)
  })
}

export async function stopRelayConf(): Promise<void> {
  await Promise.all([official?.stop(), customOrg?.stop()])
}
