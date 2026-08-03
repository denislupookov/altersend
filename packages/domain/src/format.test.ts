import { describe, expect, it } from 'vitest'
import { formatDuration, formatFileSize, formatTransferRate, formatTransferSpeed } from './format'

describe('formatFileSize', () => {
  it('formats bytes when under 1 KB', () => {
    expect(formatFileSize(0)).toBe('0 B')
    expect(formatFileSize(512)).toBe('512 B')
  })

  it('formats kilobytes with one decimal', () => {
    expect(formatFileSize(1024)).toBe('1.0 KB')
    expect(formatFileSize(1536)).toBe('1.5 KB')
  })

  it('formats megabytes with one decimal', () => {
    expect(formatFileSize(1024 * 1024)).toBe('1.0 MB')
    expect(formatFileSize(2.5 * 1024 * 1024)).toBe('2.5 MB')
  })

  it('formats gigabytes with one decimal', () => {
    expect(formatFileSize(1024 ** 3)).toBe('1.0 GB')
  })
})

describe('formatTransferSpeed', () => {
  it('appends a per-second suffix to the transferred size', () => {
    expect(formatTransferSpeed(1024 * 1024)).toBe('1.0 MB/s')
    expect(formatTransferSpeed(512)).toBe('512 B/s')
  })
})

const EN_US: Record<string, string> = {
  'common:transfer.timeLeft': '{{duration}} left',
  'common:transfer.durationSeconds': '{{seconds}}s',
  'common:transfer.durationMinutes': '{{minutes}}m',
  'common:transfer.durationMinutesSeconds': '{{minutes}}m {{seconds}}s',
  'common:transfer.durationHours': '{{hours}}h',
  'common:transfer.durationHoursMinutes': '{{hours}}h {{minutes}}m'
}

const t = (key: string, vars?: Record<string, unknown>) =>
  (EN_US[key] ?? key).replace(/\{\{(\w+)\}\}/g, (_, name: string) => String(vars?.[name] ?? ''))

describe('formatDuration', () => {
  it('formats seconds under a minute', () => {
    expect(formatDuration(0, t)).toBe('1s')
    expect(formatDuration(45.4, t)).toBe('45s')
  })

  it('adds seconds only for short minute spans', () => {
    expect(formatDuration(150, t)).toBe('2m 30s')
    expect(formatDuration(1800, t)).toBe('30m')
  })

  it('formats hours', () => {
    expect(formatDuration(3600, t)).toBe('1h')
    expect(formatDuration(5400, t)).toBe('1h 30m')
  })

  it('routes every unit through the catalog', () => {
    const localized = (key: string, vars?: Record<string, unknown>) =>
      `${key}:${JSON.stringify(vars)}`
    expect(formatDuration(45, localized)).toBe('common:transfer.durationSeconds:{"seconds":45}')
    expect(formatDuration(5400, localized)).toBe(
      'common:transfer.durationHoursMinutes:{"hours":1,"minutes":30}'
    )
  })
})

describe('formatTransferRate', () => {
  it('returns nothing while throughput is unknown', () => {
    expect(formatTransferRate({}, t)).toBeUndefined()
    expect(formatTransferRate({ bytesPerSecond: 0 }, t)).toBeUndefined()
  })

  it('shows speed alone when no estimate is available', () => {
    expect(formatTransferRate({ bytesPerSecond: 1024 * 1024 }, t)).toBe('1.0 MB/s')
  })

  it('joins speed and remaining time', () => {
    expect(formatTransferRate({ bytesPerSecond: 1024 * 1024, etaSeconds: 90 }, t)).toBe(
      '1.0 MB/s · 1m 30s left'
    )
  })
})
