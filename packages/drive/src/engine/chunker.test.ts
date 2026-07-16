import { describe, it, expect } from 'vitest'
import { selectChunkSize, chunkCount, chunkRange } from './chunker'

const KB = 1024
const MB = 1024 * KB
const GB = 1024 * MB

describe('selectChunkSize', () => {
  it('scales chunk size up with file size', () => {
    expect(selectChunkSize(500 * KB)).toBe(64 * KB)
    expect(selectChunkSize(50 * MB)).toBe(256 * KB)
    expect(selectChunkSize(5 * GB)).toBe(1 * MB)
    expect(selectChunkSize(20 * GB)).toBe(4 * MB)
  })

  it('is deterministic at tier boundaries', () => {
    expect(selectChunkSize(1 * MB)).toBe(256 * KB)
    expect(selectChunkSize(1 * MB - 1)).toBe(64 * KB)
  })
})

describe('chunkCount', () => {
  it('is zero for empty files', () => {
    expect(chunkCount(0, 64 * KB)).toBe(0)
  })

  it('rounds up the final partial chunk', () => {
    expect(chunkCount(64 * KB, 64 * KB)).toBe(1)
    expect(chunkCount(64 * KB + 1, 64 * KB)).toBe(2)
    expect(chunkCount(200 * KB, 64 * KB)).toBe(4)
  })
})

describe('chunkRange', () => {
  it('computes contiguous offsets', () => {
    expect(chunkRange(0, 200 * KB, 64 * KB)).toEqual({ offset: 0, length: 64 * KB })
    expect(chunkRange(1, 200 * KB, 64 * KB)).toEqual({ offset: 64 * KB, length: 64 * KB })
  })

  it('shortens the final chunk', () => {
    expect(chunkRange(3, 200 * KB, 64 * KB)).toEqual({ offset: 192 * KB, length: 8 * KB })
  })

  it('returns a zero-length range past EOF', () => {
    expect(chunkRange(10, 100, 64)).toEqual({ offset: 100, length: 0 })
  })
})
