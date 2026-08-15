import { describe, expect, it, vi } from 'vitest'
import { highlightsForPlatform, pickWhatsNewRelease } from './whatsNewModel'
import { RELEASE_NOTES } from './releaseNotes'

vi.mock('./releaseNotes', async () => {
  const actual = await vi.importActual<typeof import('./releaseNotes')>('./releaseNotes')
  return {
    ...actual,
    RELEASE_NOTES: [
      {
        version: '1.9.0',
        highlights: [
          { key: 'shared', titleKey: 'a.title' },
          { key: 'mobileOnly', platforms: ['mobile'], titleKey: 'b.title' }
        ]
      },
      {
        version: '1.8.0',
        highlights: [{ key: 'old', titleKey: 'c.title' }]
      }
    ]
  }
})

describe('pickWhatsNewRelease', () => {
  it('stays silent for a fresh install', () => {
    expect(
      pickWhatsNewRelease({
        currentVersion: '1.9.0',
        lastSeenVersion: null,
        isReturningUser: false
      })
    ).toBeNull()
  })

  it('shows the newest shipped release to a returning user without a stamp', () => {
    expect(
      pickWhatsNewRelease({
        currentVersion: '1.9.0',
        lastSeenVersion: null,
        isReturningUser: true
      })?.version
    ).toBe('1.9.0')
  })

  it('shows the newest release above the stamp', () => {
    expect(
      pickWhatsNewRelease({
        currentVersion: '1.9.0',
        lastSeenVersion: '1.8.0',
        isReturningUser: true
      })?.version
    ).toBe('1.9.0')
  })

  it('stays silent once the current release was seen', () => {
    expect(
      pickWhatsNewRelease({
        currentVersion: '1.9.0',
        lastSeenVersion: '1.9.0',
        isReturningUser: true
      })
    ).toBeNull()
  })

  it('ignores notes written for an unreleased version', () => {
    expect(
      pickWhatsNewRelease({
        currentVersion: '1.8.0',
        lastSeenVersion: '1.7.0',
        isReturningUser: true
      })?.version
    ).toBe('1.8.0')
  })

  it('stays silent for a patch release without notes', () => {
    expect(
      pickWhatsNewRelease({
        currentVersion: '1.9.1',
        lastSeenVersion: '1.9.0',
        isReturningUser: true
      })
    ).toBeNull()
  })
})

describe('highlightsForPlatform', () => {
  it('drops highlights that target another platform', () => {
    const note = RELEASE_NOTES[0]
    expect(highlightsForPlatform(note, 'desktop').map((h) => h.key)).toEqual(['shared'])
    expect(highlightsForPlatform(note, 'mobile').map((h) => h.key)).toEqual([
      'shared',
      'mobileOnly'
    ])
  })
})
