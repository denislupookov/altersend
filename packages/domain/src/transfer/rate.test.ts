import { describe, expect, it } from 'vitest'
import {
  getBytesPerSecond,
  getEtaSeconds,
  getTransferRate,
  pushRateSample,
  sumTransferRates
} from './rate'

function windowOf(entries: Array<[number, number]>) {
  return entries.reduce<ReturnType<typeof pushRateSample>>(
    (samples, [bytes, at]) => pushRateSample(samples, bytes, at),
    []
  )
}

describe('pushRateSample', () => {
  it('drops history when bytes go backwards', () => {
    const samples = pushRateSample([{ bytes: 500, at: 1000 }], 100, 2000)
    expect(samples).toEqual([{ bytes: 100, at: 2000 }])
  })

  it('ignores samples that do not advance the clock', () => {
    const existing = [{ bytes: 500, at: 1000 }]
    expect(pushRateSample(existing, 900, 1000)).toBe(existing)
  })

  it('keeps at least two samples once the window has passed', () => {
    const samples = windowOf([
      [0, 0],
      [1000, 20_000]
    ])
    expect(samples).toHaveLength(2)
  })

  it('trims samples older than the window', () => {
    const samples = windowOf([
      [0, 0],
      [1000, 1000],
      [2000, 2000],
      [3000, 3000],
      [7000, 7000]
    ])
    expect(samples.map((s) => s.at)).toEqual([1000, 2000, 3000, 7000])
  })
})

describe('getBytesPerSecond', () => {
  it('returns undefined without enough span to measure', () => {
    const samples = windowOf([
      [0, 0],
      [100, 200]
    ])
    expect(getBytesPerSecond(samples)).toBeUndefined()
  })

  it('averages throughput across the window', () => {
    const samples = windowOf([
      [0, 0],
      [4_000_000, 2000]
    ])
    expect(getBytesPerSecond(samples)).toBe(2_000_000)
  })

  it('reports zero once the whole window stops advancing', () => {
    const samples = windowOf([
      [4_000_000, 0],
      [4_000_000, 2000],
      [4_000_000, 4000]
    ])
    expect(getBytesPerSecond(samples)).toBe(0)
  })
})

describe('getEtaSeconds', () => {
  it('divides remaining bytes by throughput', () => {
    expect(getEtaSeconds(1_000_000, 5_000_000)).toBe(5)
  })

  it('returns undefined when stalled or finished', () => {
    expect(getEtaSeconds(0, 5_000_000)).toBeUndefined()
    expect(getEtaSeconds(undefined, 5_000_000)).toBeUndefined()
    expect(getEtaSeconds(1_000_000, 0)).toBeUndefined()
  })

  it('suppresses implausibly distant estimates', () => {
    expect(getEtaSeconds(1, 1_000_000_000)).toBeUndefined()
  })
})

describe('getTransferRate', () => {
  it('combines throughput and remaining time', () => {
    const samples = windowOf([
      [0, 0],
      [2_000_000, 2000]
    ])
    expect(
      getTransferRate(samples, { bytesTransferred: 2_000_000, totalBytes: 6_000_000 })
    ).toEqual({ bytesPerSecond: 1_000_000, etaSeconds: 4 })
  })
})

describe('sumTransferRates', () => {
  it('adds throughput across concurrent files', () => {
    expect(
      sumTransferRates([{ bytesPerSecond: 1_000_000 }, { bytesPerSecond: 3_000_000 }], 8_000_000)
    ).toEqual({ bytesPerSecond: 4_000_000, etaSeconds: 2 })
  })

  it('ignores files with no measurement yet', () => {
    expect(sumTransferRates([{ bytesPerSecond: 2_000_000 }, undefined, {}], 4_000_000)).toEqual({
      bytesPerSecond: 2_000_000,
      etaSeconds: 2
    })
  })

  it('reports nothing when no file has a measurement', () => {
    expect(sumTransferRates([undefined, {}], 4_000_000)).toEqual({
      bytesPerSecond: undefined,
      etaSeconds: undefined
    })
  })
})
