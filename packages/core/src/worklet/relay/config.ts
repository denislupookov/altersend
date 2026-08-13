import b4a from 'b4a'

interface RelayEntry {
  key: Uint8Array
  host: string
  utcOffset: number | null
}

interface WebRelayEntry {
  key: Uint8Array
  host: string
}

interface RelayState {
  enabled: boolean
  relays: RelayEntry[]
  customRelays: RelayEntry[]
  customConfigured: boolean
  customFallback: boolean
  webRelays: WebRelayEntry[]
  proToken: string | null
  sending: boolean
}

const state: RelayState = {
  enabled: false,
  relays: [],
  customRelays: [],
  customConfigured: false,
  customFallback: false,
  webRelays: [],
  proToken: null,
  sending: false
}

let relayLoader: (() => void) | null = null

export function registerRelayLoader(load: () => void): void {
  relayLoader = load
}

interface RelayEntryInput {
  keyHex: string
  host: string
  utcOffset?: number
}

interface WebRelayEntryInput {
  keyHex: string
  host: string
}

export interface RelayConfigInput {
  enabled?: boolean
  relays?: readonly RelayEntryInput[]
  customRelays?: readonly RelayEntryInput[]
  customConfigured?: boolean
  customFallback?: boolean
  webRelays?: readonly WebRelayEntryInput[]
  proToken?: string | null
}

function bareHost(host: string): string {
  let bare = host.replace(/^wss?:\/\//, '').replace(/\/.*$/, '')
  if (bare.startsWith('[')) {
    bare = bare.replace(/^\[([^\]]*)\].*$/, '$1')
  } else if ((bare.match(/:/g) ?? []).length === 1) {
    bare = bare.replace(/:\d+$/, '')
  }
  return bare.toLowerCase()
}

function toRelayEntry({ keyHex, host, utcOffset }: RelayEntryInput): RelayEntry {
  return { key: b4a.from(keyHex, 'hex'), host: bareHost(host), utcOffset: utcOffset ?? null }
}

export function configureRelay(input: RelayConfigInput): void {
  if (typeof input.enabled === 'boolean') {
    state.enabled = input.enabled
  }

  if (input.relays) {
    state.relays = input.relays.map(toRelayEntry)
  }

  if (input.customRelays) {
    state.customRelays = input.customRelays.map(toRelayEntry)
  }

  if (input.webRelays) {
    state.webRelays = input.webRelays.map(({ keyHex, host }) => ({
      key: b4a.from(keyHex, 'hex'),
      host: bareHost(host)
    }))
  }

  if (typeof input.customConfigured === 'boolean') {
    state.customConfigured = input.customConfigured
  }

  if (typeof input.customFallback === 'boolean') {
    state.customFallback = input.customFallback
  }

  if (input.proToken !== undefined) {
    state.proToken = input.proToken
  }

  if (state.enabled) relayLoader?.()
}

export function setRelaySending(sending: boolean): void {
  state.sending = sending
}

export function proTokenFor(key: Uint8Array): string | null {
  if (!state.proToken || !state.sending) return null
  if (!state.relays.some((relay) => b4a.equals(relay.key, key))) return null
  return state.proToken
}

export function relayConfigSummary(): { enabled: boolean; keyCount: number } {
  return {
    enabled: state.enabled,
    keyCount: state.relays.length + state.customRelays.length
  }
}

function offsetDistance(a: number, b: number): number {
  const diff = Math.abs(a - b)
  return Math.min(diff, 24 - diff)
}

function nearestRelays(relays: RelayEntry[]): RelayEntry[] {
  const local = -new Date().getTimezoneOffset() / 60
  const tagged = relays.filter((r) => r.utcOffset !== null)
  if (tagged.length === 0) return relays

  const best = Math.min(...tagged.map((r) => offsetDistance(r.utcOffset!, local)))
  return tagged.filter((r) => offsetDistance(r.utcOffset!, local) === best)
}

function nearestKeys(relays: RelayEntry[]): Uint8Array[] {
  if (relays.length === 0) return []
  return nearestRelays(relays).map((r) => r.key)
}

export function relayThrough(_force: boolean, _swarm?: unknown): Uint8Array[] | null {
  if (!state.enabled) return null

  if (state.customConfigured) {
    const custom = nearestKeys(state.customRelays)
    const keys = state.customFallback ? [...custom, ...nearestKeys(state.relays)] : custom
    return keys.length > 0 ? keys : null
  }

  const keys = nearestKeys(state.relays)
  return keys.length > 0 ? keys : null
}

export function isRelayHost(host: string | null | undefined): boolean {
  if (!host) return false
  const wanted = bareHost(host)
  return (
    state.relays.some((r) => r.host === wanted) || state.customRelays.some((r) => r.host === wanted)
  )
}

export function webRelayKeyForHost(host: string): Uint8Array | null {
  if (!state.proToken || !state.sending) return null
  const wanted = bareHost(host)
  return state.webRelays.find((relay) => relay.host === wanted)?.key ?? null
}

export function proToken(): string | null {
  return state.proToken
}

export function firstCustomRelayKey(): Uint8Array | null {
  return nearestKeys(state.customRelays)[0] ?? null
}
