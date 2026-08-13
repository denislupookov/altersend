import b4a from 'b4a'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  configureRelay,
  isRelayHost,
  proTokenFor,
  relayConfigSummary,
  relayThrough,
  setRelaySending
} from './config'

const KEY_A = 'a'.repeat(64)
const HOST_A = '1.2.3.4'
const KEY_B = 'b'.repeat(64)
const HOST_B = '5.6.7.8'
const KEY_C = 'c'.repeat(64)
const HOST_C = 'relay.acme.com'

const UTC_PLUS_8 = -480
const UTC_PLUS_1 = -60

function mockUtcOffset(minutes: number): void {
  vi.spyOn(Date.prototype, 'getTimezoneOffset').mockReturnValue(minutes)
}

beforeEach(() => {
  configureRelay({
    enabled: false,
    relays: [],
    customRelays: [],
    customConfigured: false,
    customFallback: false,
    proToken: null
  })
  setRelaySending(false)
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('relay/config', () => {
  it('relayThrough returns null when disabled, even with relays configured', () => {
    configureRelay({ relays: [{ keyHex: KEY_A, host: HOST_A }] })
    expect(relayThrough(false)).toBeNull()
  })

  it('relayThrough returns null when enabled but no relays', () => {
    configureRelay({ enabled: true })
    expect(relayThrough(false)).toBeNull()
  })

  it('relayThrough returns the keys when enabled with relays', () => {
    configureRelay({
      enabled: true,
      relays: [
        { keyHex: KEY_A, host: HOST_A },
        { keyHex: KEY_B, host: HOST_B }
      ]
    })
    const keys = relayThrough(false)
    expect(keys).toHaveLength(2)
    expect(keys?.map((k) => b4a.toString(k, 'hex'))).toEqual([KEY_A, KEY_B])
  })

  it('relayThrough returns the relay with the closest utc offset', () => {
    configureRelay({
      enabled: true,
      relays: [
        { keyHex: KEY_A, host: HOST_A, utcOffset: 1 },
        { keyHex: KEY_B, host: HOST_B, utcOffset: 8 }
      ]
    })

    mockUtcOffset(UTC_PLUS_8)
    expect(relayThrough(false)?.map((k) => b4a.toString(k, 'hex'))).toEqual([KEY_B])

    mockUtcOffset(UTC_PLUS_1)
    expect(relayThrough(false)?.map((k) => b4a.toString(k, 'hex'))).toEqual([KEY_A])
  })

  it('relayThrough measures offset distance around the date line', () => {
    configureRelay({
      enabled: true,
      relays: [
        { keyHex: KEY_A, host: HOST_A, utcOffset: 1 },
        { keyHex: KEY_B, host: HOST_B, utcOffset: 8 }
      ]
    })

    mockUtcOffset(600)
    expect(relayThrough(false)?.map((k) => b4a.toString(k, 'hex'))).toEqual([KEY_B])
  })

  it('relayThrough returns all relays when entries carry no utc offset', () => {
    configureRelay({
      enabled: true,
      relays: [
        { keyHex: KEY_A, host: HOST_A },
        { keyHex: KEY_B, host: HOST_B }
      ]
    })

    mockUtcOffset(UTC_PLUS_8)
    expect(relayThrough(false)).toHaveLength(2)
  })

  it('isRelayHost matches configured hosts only', () => {
    configureRelay({ enabled: true, relays: [{ keyHex: KEY_A, host: HOST_A }] })
    expect(isRelayHost(HOST_A)).toBe(true)
    expect(isRelayHost(HOST_B)).toBe(false)
    expect(isRelayHost(null)).toBe(false)
    expect(isRelayHost(undefined)).toBe(false)
  })

  it('configureRelay replaces relays; summary and isRelayHost follow', () => {
    configureRelay({ enabled: true, relays: [{ keyHex: KEY_A, host: HOST_A }] })
    expect(relayConfigSummary()).toEqual({ enabled: true, keyCount: 1 })

    configureRelay({ relays: [] })
    expect(relayConfigSummary()).toEqual({ enabled: true, keyCount: 0 })
    expect(isRelayHost(HOST_A)).toBe(false)
  })

  it('custom relays replace official ones entirely (hyperdht picks at random, order is no preference)', () => {
    configureRelay({
      enabled: true,
      relays: [
        { keyHex: KEY_A, host: HOST_A, utcOffset: 1 },
        { keyHex: KEY_B, host: HOST_B, utcOffset: 8 }
      ],
      customRelays: [{ keyHex: KEY_C, host: HOST_C }],
      customConfigured: true
    })

    mockUtcOffset(UTC_PLUS_8)
    expect(relayThrough(false)?.map((k) => b4a.toString(k, 'hex'))).toEqual([KEY_C])
  })

  it('relayThrough works with only custom relays', () => {
    configureRelay({
      enabled: true,
      customRelays: [{ keyHex: KEY_C, host: HOST_C }],
      customConfigured: true
    })
    expect(relayThrough(false)?.map((k) => b4a.toString(k, 'hex'))).toEqual([KEY_C])
  })

  it('fallback adds the nearest official relays after the custom ones', () => {
    configureRelay({
      enabled: true,
      relays: [
        { keyHex: KEY_A, host: HOST_A, utcOffset: 1 },
        { keyHex: KEY_B, host: HOST_B, utcOffset: 8 }
      ],
      customRelays: [{ keyHex: KEY_C, host: HOST_C }],
      customConfigured: true,
      customFallback: true
    })

    mockUtcOffset(UTC_PLUS_8)
    expect(relayThrough(false)?.map((k) => b4a.toString(k, 'hex'))).toEqual([KEY_C, KEY_B])
  })

  it('isRelayHost matches custom relay hosts ignoring case and port', () => {
    configureRelay({ enabled: true, customRelays: [{ keyHex: KEY_C, host: HOST_C }] })
    expect(isRelayHost(HOST_C)).toBe(true)
    expect(isRelayHost(HOST_C.toUpperCase())).toBe(true)
    expect(isRelayHost(`${HOST_C}:49737`)).toBe(true)
  })

  it('summary counts custom relays', () => {
    configureRelay({
      enabled: true,
      relays: [{ keyHex: KEY_A, host: HOST_A }],
      customRelays: [{ keyHex: KEY_C, host: HOST_C }]
    })
    expect(relayConfigSummary()).toEqual({ enabled: true, keyCount: 2 })
  })
})

const RELAY_KEY = 'aa'.repeat(32)
const OTHER_KEY = 'bb'.repeat(32)
const TOKEN = 'signed.token'

function relayKey(): Uint8Array {
  return b4a.from(RELAY_KEY, 'hex')
}

describe('proTokenFor', () => {
  beforeEach(() => {
    configureRelay({
      enabled: true,
      relays: [{ keyHex: RELAY_KEY, host: '1.2.3.4' }],
      proToken: TOKEN
    })
    setRelaySending(true)
  })

  it('announces to a known relay while sending', () => {
    expect(proTokenFor(relayKey())).toBe(TOKEN)
  })

  it('stays silent while receiving', () => {
    setRelaySending(false)
    expect(proTokenFor(relayKey())).toBeNull()
  })

  it('stays silent with no token', () => {
    configureRelay({ proToken: null })
    expect(proTokenFor(relayKey())).toBeNull()
  })

  it('never announces to a key that is not a configured relay', () => {
    expect(proTokenFor(b4a.from(OTHER_KEY, 'hex'))).toBeNull()
  })

  it('never announces to a custom relay — the token must not reach third-party hosts', () => {
    configureRelay({ customRelays: [{ keyHex: OTHER_KEY, host: 'relay.acme.com' }] })
    expect(proTokenFor(b4a.from(OTHER_KEY, 'hex'))).toBeNull()
  })

  it('keeps the token when unrelated config changes', () => {
    configureRelay({ enabled: true })
    expect(proTokenFor(relayKey())).toBe(TOKEN)
  })
})

describe('isRelayHost host normalization', () => {
  it('does not collapse distinct IPv6 addresses', () => {
    configureRelay({
      enabled: true,
      relays: [{ keyHex: KEY_A, host: '2001:db8::1' }],
      customRelays: [],
      customConfigured: false
    })
    expect(isRelayHost('2001:db8::1')).toBe(true)
    expect(isRelayHost('2001:db8::9')).toBe(false)
  })

  it('strips the port from bracketed IPv6 and plain host:port', () => {
    configureRelay({
      enabled: true,
      relays: [{ keyHex: KEY_A, host: '[2001:db8::1]:49737' }],
      customRelays: [],
      customConfigured: false
    })
    expect(isRelayHost('2001:db8::1')).toBe(true)
    expect(isRelayHost('[2001:db8::1]:49737')).toBe(true)
  })
})

describe('custom relays use the same nearest-first selection as official', () => {
  const KEY_D = 'd'.repeat(64)

  it('picks the closest custom relay by utc offset', () => {
    configureRelay({
      enabled: true,
      relays: [],
      customRelays: [
        { keyHex: KEY_C, host: 'nyc.acme.com', utcOffset: -5 },
        { keyHex: KEY_D, host: 'sgp.acme.com', utcOffset: 8 }
      ],
      customConfigured: true
    })

    mockUtcOffset(UTC_PLUS_8)
    expect(relayThrough(false)?.map((k) => b4a.toString(k, 'hex'))).toEqual([KEY_D])

    mockUtcOffset(300)
    expect(relayThrough(false)?.map((k) => b4a.toString(k, 'hex'))).toEqual([KEY_C])
  })

  it('keeps every custom relay when the org record carries no utc offsets', () => {
    configureRelay({
      enabled: true,
      relays: [],
      customRelays: [
        { keyHex: KEY_C, host: 'a.acme.com' },
        { keyHex: KEY_D, host: 'b.acme.com' }
      ],
      customConfigured: true
    })

    mockUtcOffset(UTC_PLUS_8)
    expect(relayThrough(false)).toHaveLength(2)
  })

  it('fallback appends the nearest official relay to the nearest custom one', () => {
    configureRelay({
      enabled: true,
      relays: [
        { keyHex: KEY_A, host: HOST_A, utcOffset: -5 },
        { keyHex: KEY_B, host: HOST_B, utcOffset: 8 }
      ],
      customRelays: [
        { keyHex: KEY_C, host: 'nyc.acme.com', utcOffset: -5 },
        { keyHex: KEY_D, host: 'sgp.acme.com', utcOffset: 8 }
      ],
      customConfigured: true,
      customFallback: true
    })

    mockUtcOffset(UTC_PLUS_8)
    expect(relayThrough(false)?.map((k) => b4a.toString(k, 'hex'))).toEqual([KEY_D, KEY_B])
  })
})
