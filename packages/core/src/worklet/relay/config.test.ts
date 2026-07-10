import b4a from 'b4a'
import { beforeEach, describe, expect, it } from 'vitest'
import { configureRelay, isRelayHost, relayConfigSummary, relayThrough } from './config'

const KEY_A = 'a'.repeat(64)
const HOST_A = '1.2.3.4'
const KEY_B = 'b'.repeat(64)
const HOST_B = '5.6.7.8'

beforeEach(() => {
  configureRelay({ enabled: false, relays: [] })
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
})
