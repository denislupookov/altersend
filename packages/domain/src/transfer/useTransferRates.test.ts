import { describe, expect, it } from 'vitest'
import { isSameRates } from './useTransferRates'

describe('isSameRates', () => {
  it('treats identical maps as unchanged', () => {
    expect(
      isSameRates(
        { a: { bytesPerSecond: 10, etaSeconds: 2 } },
        { a: { bytesPerSecond: 10, etaSeconds: 2 } }
      )
    ).toBe(true)
  })

  it('detects a swapped key even when both values are unmeasured', () => {
    expect(isSameRates({ a: {} }, { b: {} })).toBe(false)
  })

  it('detects a swapped key when the count stays the same', () => {
    expect(isSameRates({ a: { bytesPerSecond: 500 } }, { b: {} })).toBe(false)
  })

  it('detects a changed value', () => {
    expect(isSameRates({ a: { bytesPerSecond: 10 } }, { a: { bytesPerSecond: 20 } })).toBe(false)
  })

  it('detects added and removed keys', () => {
    expect(isSameRates({ a: {} }, { a: {}, b: {} })).toBe(false)
    expect(isSameRates({ a: {}, b: {} }, { a: {} })).toBe(false)
  })
})
