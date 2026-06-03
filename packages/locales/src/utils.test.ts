import { describe, expect, it } from 'vitest'
import { PICKABLE_LANGUAGES } from './languages'
import { getInitialLocale, resolveSupportedLocale } from './utils'

describe('resolveSupportedLocale', () => {
  it('returns an exact production-ready match', () => {
    expect(resolveSupportedLocale('en')).toBe('en')
  })

  it('matches case-insensitively', () => {
    expect(resolveSupportedLocale('EN')).toBe('en')
  })

  it('matches a regional tag by its primary subtag', () => {
    expect(resolveSupportedLocale('en-US')).toBe('en')
    expect(resolveSupportedLocale('en-GB')).toBe('en')
  })

  it('falls back to English for not-yet-ready languages', () => {
    // pt-BR is registered but not production-ready, so it must not be selected.
    expect(resolveSupportedLocale('pt-BR')).toBe('en')
    expect(resolveSupportedLocale('pt-PT')).toBe('en')
  })

  it('falls back to English for unsupported or empty input', () => {
    expect(resolveSupportedLocale('de-DE')).toBe('en')
    expect(resolveSupportedLocale('')).toBe('en')
    expect(resolveSupportedLocale(null)).toBe('en')
    expect(resolveSupportedLocale(undefined)).toBe('en')
  })
})

describe('getInitialLocale', () => {
  it('always resolves to a production-ready locale', () => {
    const codes = PICKABLE_LANGUAGES.map((l) => l.code)
    expect(codes).toContain(getInitialLocale())
  })
})
