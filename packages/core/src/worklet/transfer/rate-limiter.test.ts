import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { RateLimiter } from './rate-limiter'

const MB = 1024 ** 2

describe('RateLimiter', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(0)
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  const settledAfter = async (promise: Promise<void>, ms: number) => {
    let settled = false
    promise.then(() => {
      settled = true
    })
    await vi.advanceTimersByTimeAsync(ms)
    return settled
  }

  it('lets the first chunk through immediately', async () => {
    const limiter = new RateLimiter(MB)
    expect(await settledAfter(limiter.take(MB), 0)).toBe(true)
  })

  it('spaces later chunks to the configured rate', async () => {
    const limiter = new RateLimiter(MB)
    await limiter.take(MB)

    const second = limiter.take(MB / 2)
    expect(await settledAfter(second, 999)).toBe(false)
    expect(await settledAfter(second, 1)).toBe(true)

    const third = limiter.take(MB)
    expect(await settledAfter(third, 499)).toBe(false)
    expect(await settledAfter(third, 1)).toBe(true)
  })

  it('does not bank unused time while idle', async () => {
    const limiter = new RateLimiter(MB)
    await limiter.take(MB)
    await vi.advanceTimersByTimeAsync(10_000)

    await limiter.take(MB)
    const next = limiter.take(MB)
    expect(await settledAfter(next, 999)).toBe(false)
    expect(await settledAfter(next, 1)).toBe(true)
  })
})
