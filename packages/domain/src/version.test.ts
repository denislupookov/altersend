import { describe, expect, it } from 'vitest'
import { compareVersions, isNewerVersion } from './version'

describe('compareVersions', () => {
  it('orders release versions numerically', () => {
    expect(compareVersions('1.9.0', '1.10.0')).toBe(-1)
    expect(compareVersions('2.0.0', '1.9.9')).toBe(1)
    expect(compareVersions('1.8.0', '1.8.0')).toBe(0)
  })

  it('treats missing segments as zero', () => {
    expect(compareVersions('2.0', '2.0.0')).toBe(0)
    expect(compareVersions('2.0.1', '2.0')).toBe(1)
  })

  it('tolerates a leading v', () => {
    expect(compareVersions('v2.0.0', '2.0.0')).toBe(0)
  })

  it('ranks a prerelease below its release', () => {
    expect(compareVersions('2.0.0-beta.1', '2.0.0')).toBe(-1)
    expect(compareVersions('2.0.0', '2.0.0-rc.1')).toBe(1)
    expect(compareVersions('2.0.0-beta.1', '1.9.0')).toBe(1)
  })

  it('orders prerelease identifiers', () => {
    expect(compareVersions('2.0.0-beta.1', '2.0.0-beta.2')).toBe(-1)
    expect(compareVersions('2.0.0-beta.2', '2.0.0-beta.10')).toBe(-1)
    expect(compareVersions('2.0.0-alpha', '2.0.0-beta')).toBe(-1)
    expect(compareVersions('2.0.0-beta', '2.0.0-beta.1')).toBe(-1)
  })

  it('sorts unparsable input below anything numbered', () => {
    expect(compareVersions('', '1.0.0')).toBe(-1)
  })
})

describe('isNewerVersion', () => {
  it('is true only when the candidate is ahead', () => {
    expect(isNewerVersion('2.0.0', '1.8.0')).toBe(true)
    expect(isNewerVersion('1.8.0', '2.0.0')).toBe(false)
    expect(isNewerVersion('2.0.0', '2.0.0')).toBe(false)
    expect(isNewerVersion('2.0.0-rc.1', '2.0.0')).toBe(false)
  })
})
