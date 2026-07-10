import b4a from 'b4a'

interface RelayEntry {
  key: Uint8Array
  host: string
}

interface RelayState {
  enabled: boolean
  relays: RelayEntry[]
}

const state: RelayState = {
  enabled: false,
  relays: []
}

let relayLoader: (() => void) | null = null

export function registerRelayLoader(load: () => void): void {
  relayLoader = load
}

interface RelayEntryInput {
  keyHex: string
  host: string
}

export interface RelayConfigInput {
  enabled?: boolean
  relays?: readonly RelayEntryInput[]
}

function toRelayEntry({ keyHex, host }: RelayEntryInput): RelayEntry {
  return { key: b4a.from(keyHex, 'hex'), host }
}

export function configureRelay(input: RelayConfigInput): void {
  if (typeof input.enabled === 'boolean') {
    state.enabled = input.enabled
  }

  if (input.relays) {
    state.relays = input.relays.map(toRelayEntry)
  }

  if (state.enabled) relayLoader?.()
}

export function relayConfigSummary(): { enabled: boolean; keyCount: number } {
  return { enabled: state.enabled, keyCount: state.relays.length }
}

export function relayThrough(_force: boolean, _swarm?: unknown): Uint8Array[] | null {
  if (!state.enabled || state.relays.length === 0) return null
  return state.relays.map((r) => r.key)
}

export function isRelayHost(host: string | null | undefined): boolean {
  return !!host && state.relays.some((r) => r.host === host)
}
