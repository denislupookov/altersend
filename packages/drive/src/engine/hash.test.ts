import { describe, it, expect } from 'vitest'
import { hashChunk, createHasher } from './hash'

describe('hashChunk', () => {
  it('is deterministic for the same bytes', () => {
    const data = new Uint8Array([1, 2, 3, 4, 5])
    expect(hashChunk(data)).toBe(hashChunk(data.slice()))
  })

  it('differs for different bytes', () => {
    expect(hashChunk(new Uint8Array([1, 2, 3]))).not.toBe(hashChunk(new Uint8Array([1, 2, 4])))
  })

  it('returns a 32-byte (64 hex char) digest', () => {
    expect(hashChunk(new Uint8Array([0]))).toMatch(/^[0-9a-f]{64}$/)
  })
})

describe('createHasher', () => {
  it('matches the one-shot hash when fed the whole buffer', () => {
    const data = new Uint8Array([10, 20, 30, 40, 50, 60])
    const h = createHasher()
    h.update(data)
    expect(h.digest()).toBe(hashChunk(data))
  })

  it('matches regardless of how bytes are split across updates', () => {
    const data = new Uint8Array([10, 20, 30, 40, 50, 60])
    const h = createHasher()
    h.update(data.subarray(0, 2))
    h.update(data.subarray(2, 5))
    h.update(data.subarray(5))
    expect(h.digest()).toBe(hashChunk(data))
  })
})
