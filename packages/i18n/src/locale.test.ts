import { describe, expect, it } from 'vitest'
import {
  DEFAULT_LOCALE,
  LOCALE_OPTIONS,
  SUPPORTED_LOCALES,
  getLocaleByCode,
  getLocaleFontFamily,
  isMultiLangEnabled,
  isLocalePreference,
  resolveActiveLocalePreference,
  resolveLocalePreference
} from './locale'

describe('locale registry', () => {
  it('registers the production-ready locale set in picker order', () => {
    expect(SUPPORTED_LOCALES.map((locale) => locale.code)).toEqual([
      'en-US',
      'en-GB',
      'de-DE',
      'es-419',
      'es-ES',
      'fr-FR',
      'it-IT',
      'pt-BR',
      'ja-JP',
      'ko-KR',
      'zh-CN',
      'zh-TW'
    ])
  })

  it('puts the system option first in picker options', () => {
    expect(LOCALE_OPTIONS[0]).toMatchObject({ preference: 'system' })
    expect(LOCALE_OPTIONS.slice(1).map((option) => option.preference)).toEqual(
      SUPPORTED_LOCALES.map((locale) => locale.code)
    )
  })

  it('validates locale preferences', () => {
    expect(isLocalePreference('system')).toBe(true)
    expect(isLocalePreference('es-419')).toBe(true)
    expect(isLocalePreference('es-MX')).toBe(false)
  })

  it('looks up locale metadata by code', () => {
    expect(getLocaleByCode('ja-JP')).toMatchObject({
      code: 'ja-JP',
      nativeName: '日本語',
      dir: 'ltr'
    })
    expect(getLocaleByCode('ar')).toBeUndefined()
  })

  it('maps CJK locales to bundled script font families', () => {
    expect(getLocaleFontFamily('ja-JP')).toBe('japanese')
    expect(getLocaleFontFamily('ko-KR')).toBe('korean')
    expect(getLocaleFontFamily('zh-CN')).toBe('simplifiedChinese')
    expect(getLocaleFontFamily('zh-TW')).toBe('traditionalChinese')
  })
})

describe('resolveLocalePreference', () => {
  it('keeps an explicit supported locale', () => {
    expect(resolveLocalePreference('en-GB', ['ja-JP'])).toBe('en-GB')
  })

  it('uses the first matching system locale for system preference', () => {
    expect(resolveLocalePreference('system', ['fr-CA', 'de-DE'])).toBe('fr-FR')
  })

  it('normalizes common language and regional tags', () => {
    expect(resolveLocalePreference('system', ['en'])).toBe('en-US')
    expect(resolveLocalePreference('system', ['en-AU'])).toBe('en-US')
    expect(resolveLocalePreference('system', ['ja'])).toBe('ja-JP')
    expect(resolveLocalePreference('system', ['ko'])).toBe('ko-KR')
    expect(resolveLocalePreference('system', ['zh-Hans'])).toBe('zh-CN')
    expect(resolveLocalePreference('system', ['zh-Hant'])).toBe('zh-TW')
    expect(resolveLocalePreference('system', ['zh-HK'])).toBe('zh-TW')
    expect(resolveLocalePreference('system', ['es-MX'])).toBe('es-419')
    expect(resolveLocalePreference('system', ['es-AR'])).toBe('es-419')
    expect(resolveLocalePreference('system', ['es'])).toBe('es-419')
    expect(resolveLocalePreference('system', ['pt'])).toBe('pt-BR')
  })

  it('falls back to en-US for unsupported or empty inputs', () => {
    expect(resolveLocalePreference('system', ['ru-RU'])).toBe(DEFAULT_LOCALE)
    expect(resolveLocalePreference('system', [])).toBe(DEFAULT_LOCALE)
    expect(resolveLocalePreference('not-a-locale', ['ja-JP'])).toBe(DEFAULT_LOCALE)
  })
})

describe('release-gated locale activation', () => {
  it('keeps multi-language UI disabled until release', () => {
    expect(isMultiLangEnabled).toBe(false)
  })

  it('forces en-US while multi-language support is release-gated', () => {
    expect(resolveActiveLocalePreference('ja-JP', ['ja-JP'])).toBe(DEFAULT_LOCALE)
    expect(resolveActiveLocalePreference('system', ['ko-KR'])).toBe(DEFAULT_LOCALE)
  })
})
