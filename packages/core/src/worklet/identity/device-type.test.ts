import { describe, it, expect } from 'vitest'
import { DEVICE_TYPES, isDeviceType } from './device-type'

describe('isDeviceType', () => {
  it('accepts every known device type', () => {
    for (const t of DEVICE_TYPES) expect(isDeviceType(t)).toBe(true)
  })

  it('rejects unknown strings and non-strings', () => {
    expect(isDeviceType('toaster')).toBe(false)
    expect(isDeviceType('')).toBe(false)
    expect(isDeviceType(undefined)).toBe(false)
    expect(isDeviceType(42)).toBe(false)
  })
})
