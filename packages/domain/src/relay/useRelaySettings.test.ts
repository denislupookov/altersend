import { describe, expect, it } from 'vitest'
import { deriveRelayMode } from './useRelaySettings'

const KEY = 'a'.repeat(64)

describe('deriveRelayMode', () => {
  it('maps disabled to off regardless of custom', () => {
    expect(deriveRelayMode(false, null)).toBe('off')
    expect(deriveRelayMode(false, { kind: 'org', keyHex: KEY })).toBe('off')
  })

  it('maps enabled without custom to altersend', () => {
    expect(deriveRelayMode(true, null)).toBe('altersend')
  })

  it('maps enabled with custom to custom', () => {
    expect(deriveRelayMode(true, { kind: 'relay', keyHex: KEY, host: '1.2.3.4' })).toBe('custom')
  })
})
