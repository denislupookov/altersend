import { describe, expect, it } from 'vitest'
import { applyDownloadMessage, isAutoResumable, type DownloadItemState } from './downloadModel'

const failed = (overrides: Partial<DownloadItemState> = {}): DownloadItemState => ({
  status: 'failed',
  bytesTransferred: 400,
  totalBytes: 1000,
  resumable: true,
  savedTo: '/tmp/a.bin',
  ...overrides
})

describe('isAutoResumable', () => {
  it('retries a resumable network failure', () => {
    expect(isAutoResumable(failed())).toBe(true)
  })

  it('never retries a download the user paused', () => {
    expect(isAutoResumable(failed({ pausedByUser: true }))).toBe(false)
  })

  it('stops once retries are exhausted', () => {
    expect(isAutoResumable(failed({ retriesExhausted: true }))).toBe(false)
  })

  it('ignores failures that cannot be resumed', () => {
    expect(isAutoResumable(failed({ resumable: false }))).toBe(false)
    expect(isAutoResumable(failed({ savedTo: undefined }))).toBe(false)
  })

  it('keeps a known partial resumable when a retry fails instantly', () => {
    const previous = failed()
    const next = applyDownloadMessage({ a: previous }, 'a', {
      type: 'status',
      state: 'download-failed',
      fileId: 'a',
      message: 'peer unavailable'
    } as never)

    expect(next.a.resumable).toBe(true)
    expect(isAutoResumable(next.a)).toBe(true)
  })

  it('ignores downloads that are not failed', () => {
    expect(isAutoResumable(failed({ status: 'downloading' }))).toBe(false)
    expect(isAutoResumable(undefined)).toBe(false)
  })
})
