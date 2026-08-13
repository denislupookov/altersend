import { describe, expect, it } from 'vitest'
import { formatCustomRelayString, parseCustomRelayString } from './customRelay'

const KEY = 'a'.repeat(64)

describe('parseCustomRelayString', () => {
  it('parses a relay string', () => {
    expect(parseCustomRelayString(`relay:${KEY}@1.2.3.4`)).toEqual({
      kind: 'relay',
      keyHex: KEY,
      host: '1.2.3.4'
    })
  })

  it('parses an org string', () => {
    expect(parseCustomRelayString(`org:${KEY}`)).toEqual({ kind: 'org', keyHex: KEY })
  })

  it('trims and lowercases', () => {
    expect(parseCustomRelayString(`  org:${KEY.toUpperCase()}  `)).toEqual({
      kind: 'org',
      keyHex: KEY
    })
  })

  it('accepts capitalized prefixes (mobile auto-capitalization)', () => {
    expect(parseCustomRelayString(`Relay:${KEY}@1.2.3.4`)).toEqual({
      kind: 'relay',
      keyHex: KEY,
      host: '1.2.3.4'
    })
    expect(parseCustomRelayString(`ORG:${KEY}`)).toEqual({ kind: 'org', keyHex: KEY })
  })

  it('accepts a host with a port', () => {
    expect(parseCustomRelayString(`relay:${KEY}@1.2.3.4:49737`)).toEqual({
      kind: 'relay',
      keyHex: KEY,
      host: '1.2.3.4:49737'
    })
  })

  it('accepts a domain host', () => {
    expect(parseCustomRelayString(`relay:${KEY}@relay.acme.com`)).toEqual({
      kind: 'relay',
      keyHex: KEY,
      host: 'relay.acme.com'
    })
  })

  it('refuses bad input', () => {
    expect(parseCustomRelayString('')).toBeNull()
    expect(parseCustomRelayString(null)).toBeNull()
    expect(parseCustomRelayString(undefined)).toBeNull()
    expect(parseCustomRelayString(KEY)).toBeNull()
    expect(parseCustomRelayString(`relay:${KEY}`)).toBeNull()
    expect(parseCustomRelayString(`relay:${KEY}@`)).toBeNull()
    expect(parseCustomRelayString(`relay:${KEY}@a b`)).toBeNull()
    expect(parseCustomRelayString(`relay:${KEY.slice(1)}@1.2.3.4`)).toBeNull()
    expect(parseCustomRelayString(`org:${KEY}x`)).toBeNull()
    expect(parseCustomRelayString(`org:${KEY.slice(0, 63)}g`)).toBeNull()
  })
})

describe('formatCustomRelayString', () => {
  it('round-trips through parse', () => {
    const relay = { kind: 'relay', keyHex: KEY, host: 'relay.acme.com' } as const
    const org = { kind: 'org', keyHex: KEY } as const
    expect(parseCustomRelayString(formatCustomRelayString(relay))).toEqual(relay)
    expect(parseCustomRelayString(formatCustomRelayString(org))).toEqual(org)
  })
})
