import { describe, it, expect } from 'vitest'
import { Bitmap } from './bitmap'

describe('Bitmap', () => {
  it('sets and reads individual bits', () => {
    const b = new Bitmap(20)
    expect(b.get(5)).toBe(false)
    b.set(5)
    expect(b.get(5)).toBe(true)
    expect(b.get(6)).toBe(false)
  })

  it('counts set bits and reports completeness', () => {
    const b = new Bitmap(3)
    expect(b.allSet()).toBe(false)
    b.set(0)
    b.set(1)
    b.set(2)
    expect(b.count()).toBe(3)
    expect(b.allSet()).toBe(true)
  })

  it('lists missing indices ascending', () => {
    const b = new Bitmap(5)
    b.set(1)
    b.set(3)
    expect(b.missing()).toEqual([0, 2, 4])
  })

  it('rejects out-of-range writes', () => {
    const b = new Bitmap(4)
    expect(() => b.set(4)).toThrow()
  })

  it('round-trips through serialize/deserialize', () => {
    const b = new Bitmap(10)
    b.set(0)
    b.set(9)
    const restored = Bitmap.deserialize(10, b.serialize())
    expect(restored.get(0)).toBe(true)
    expect(restored.get(9)).toBe(true)
    expect(restored.missing()).toEqual([1, 2, 3, 4, 5, 6, 7, 8])
  })

  it('treats an empty bitmap as complete', () => {
    expect(new Bitmap(0).allSet()).toBe(true)
  })
})
