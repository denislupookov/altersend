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
  proRelays: RelayEntry[]
  customRelays: RelayEntry[]
  customConfigured: boolean
  customFallback: boolean
  webRelays: WebRelayEntry[]
  proToken: string | null
  role: RelayRole
  busyUntil: Map<string, number>
}

type RelayRole = 'sender' | 'receiver' | null

const state: RelayState = {
  enabled: false,
  relays: [],
  proRelays: [],
  customRelays: [],
  customConfigured: false,
  customFallback: false,
  webRelays: [],
  proToken: null,
  role: null,
  busyUntil: new Map()
}

const BUSY_TTL_MS = 10 * 60 * 1000

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
  proRelays?: readonly RelayEntryInput[]
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
    state.busyUntil.clear()
  }

  if (input.proRelays) {
    state.proRelays = input.proRelays.map(toRelayEntry)
    state.busyUntil.clear()
  }

  if (input.customRelays) {
    state.customRelays = input.customRelays.map(toRelayEntry)
    state.busyUntil.clear()
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
    if (input.proToken && input.proToken !== state.proToken) state.busyUntil.clear()
    state.proToken = input.proToken
  }

  if (state.enabled) relayLoader?.()
}

export function setRelayRole(role: RelayRole): void {
  state.role = role
}

export function proTokenFor(key: Uint8Array): string | null {
  if (!state.proToken || state.role === null) return null
  if (!officialRelays().some((relay) => b4a.equals(relay.key, key))) return null
  return state.proToken
}

export function relayConfigSummary(): { enabled: boolean; keyCount: number } {
  return {
    enabled: state.enabled,
    keyCount: state.relays.length + state.proRelays.length + state.customRelays.length
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

function isAvailable(relay: RelayEntry): boolean {
  const until = state.busyUntil.get(b4a.toString(relay.key, 'hex'))
  return until === undefined || until <= Date.now()
}

function officialRelays(): RelayEntry[] {
  return state.proToken ? [...state.proRelays, ...state.relays] : state.relays
}

function officialKeys(): Uint8Array[] {
  if (state.proToken) {
    const pro = nearestKeys(state.proRelays.filter(isAvailable))
    if (pro.length > 0) return pro
  }
  return nearestKeys(state.relays.filter(isAvailable))
}

function usableRelayKeys(): Uint8Array[] {
  if (state.customConfigured) {
    const custom = nearestKeys(state.customRelays.filter(isAvailable))
    return state.customFallback ? [...custom, ...officialKeys()] : custom
  }

  return officialKeys()
}

export function markRelayBusy(key: Uint8Array): void {
  state.busyUntil.set(b4a.toString(key, 'hex'), Date.now() + BUSY_TTL_MS)
}

function configuredRelays(): RelayEntry[] {
  if (!state.customConfigured) return officialRelays()
  return state.customFallback ? [...state.customRelays, ...officialRelays()] : state.customRelays
}

export function allRelaysBusy(): boolean {
  const relays = configuredRelays()
  return state.enabled && relays.length > 0 && !relays.some(isAvailable)
}

export function isRelayKey(key: Uint8Array): boolean {
  return [...state.relays, ...state.proRelays, ...state.customRelays].some((relay) =>
    b4a.equals(relay.key, key)
  )
}

function isRandomizedNat(swarm: unknown): boolean {
  return (swarm as { dht?: { randomized?: boolean } } | undefined)?.dht?.randomized === true
}

export function wantsRelay(force: boolean, swarm?: unknown): boolean {
  return state.enabled && (force || isRandomizedNat(swarm))
}

export function relayThrough(force: boolean, swarm?: unknown): Uint8Array[] | null {
  if (!wantsRelay(force, swarm)) return null

  const keys = usableRelayKeys()
  return keys.length > 0 ? keys : null
}

export function isRelayHost(host: string | null | undefined): boolean {
  if (!host) return false
  const wanted = bareHost(host)
  return [...state.relays, ...state.proRelays, ...state.customRelays].some((r) => r.host === wanted)
}

export function webRelayKeyForHost(host: string): Uint8Array | null {
  if (!state.proToken || state.role !== 'sender') return null
  const wanted = bareHost(host)
  return state.webRelays.find((relay) => relay.host === wanted)?.key ?? null
}

export function proToken(): string | null {
  return state.proToken
}

export function firstCustomRelayKey(): Uint8Array | null {
  return nearestKeys(state.customRelays)[0] ?? null
}
