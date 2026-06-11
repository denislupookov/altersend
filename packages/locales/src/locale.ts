import releaseConfig from './release.json'

export const DEFAULT_LOCALE = 'en-US'
export const SYSTEM_LOCALE_PREFERENCE = 'system'
export const isMultiLangEnabled: boolean = releaseConfig.isMultiLangEnabled

export type TextDirection = 'ltr' | 'rtl'
export type LocaleFontFamily =
  | 'latin'
  | 'japanese'
  | 'korean'
  | 'simplifiedChinese'
  | 'traditionalChinese'

export type SupportedLocaleCode =
  | 'en-US'
  | 'en-GB'
  | 'ja-JP'
  | 'ko-KR'
  | 'zh-CN'
  | 'zh-TW'
  | 'fr-FR'
  | 'de-DE'
  | 'it-IT'
  | 'pt-BR'
  | 'es-419'
  | 'es-ES'

export type LocalePreference = typeof SYSTEM_LOCALE_PREFERENCE | SupportedLocaleCode

export interface SupportedLocale {
  code: SupportedLocaleCode
  englishName: string
  nativeName: string
  dir: TextDirection
  fontFamily: LocaleFontFamily
}

export interface LocaleOption {
  preference: LocalePreference
  label: string
  nativeName?: string
  resolvedCode?: SupportedLocaleCode
}

export const SUPPORTED_LOCALES: SupportedLocale[] = [
  {
    code: 'en-US',
    englishName: 'English (US)',
    nativeName: 'English (US)',
    dir: 'ltr',
    fontFamily: 'latin'
  },
  {
    code: 'en-GB',
    englishName: 'English (UK)',
    nativeName: 'English (UK)',
    dir: 'ltr',
    fontFamily: 'latin'
  },
  {
    code: 'de-DE',
    englishName: 'German',
    nativeName: 'Deutsch',
    dir: 'ltr',
    fontFamily: 'latin'
  },
  {
    code: 'es-419',
    englishName: 'Spanish (Latin America)',
    nativeName: 'Español (Latinoamérica)',
    dir: 'ltr',
    fontFamily: 'latin'
  },
  {
    code: 'es-ES',
    englishName: 'Spanish (Spain)',
    nativeName: 'Español (España)',
    dir: 'ltr',
    fontFamily: 'latin'
  },
  {
    code: 'fr-FR',
    englishName: 'French',
    nativeName: 'Français',
    dir: 'ltr',
    fontFamily: 'latin'
  },
  {
    code: 'it-IT',
    englishName: 'Italian',
    nativeName: 'Italiano',
    dir: 'ltr',
    fontFamily: 'latin'
  },
  {
    code: 'pt-BR',
    englishName: 'Portuguese (Brazil)',
    nativeName: 'Português (Brasil)',
    dir: 'ltr',
    fontFamily: 'latin'
  },
  {
    code: 'ja-JP',
    englishName: 'Japanese',
    nativeName: '日本語',
    dir: 'ltr',
    fontFamily: 'japanese'
  },
  {
    code: 'ko-KR',
    englishName: 'Korean',
    nativeName: '한국어',
    dir: 'ltr',
    fontFamily: 'korean'
  },
  {
    code: 'zh-CN',
    englishName: 'Chinese (Simplified)',
    nativeName: '简体中文',
    dir: 'ltr',
    fontFamily: 'simplifiedChinese'
  },
  {
    code: 'zh-TW',
    englishName: 'Chinese (Traditional)',
    nativeName: '繁體中文',
    dir: 'ltr',
    fontFamily: 'traditionalChinese'
  }
]

const SUPPORTED_CODES = new Set<string>(SUPPORTED_LOCALES.map((locale) => locale.code))

export const LOCALE_OPTIONS: LocaleOption[] = [
  { preference: SYSTEM_LOCALE_PREFERENCE, label: 'System default' },
  ...SUPPORTED_LOCALES.map((locale) => ({
    preference: locale.code,
    label: locale.englishName,
    nativeName: locale.nativeName,
    resolvedCode: locale.code
  }))
]

export function getLocaleByCode(code: string): SupportedLocale | undefined {
  return SUPPORTED_LOCALES.find((locale) => locale.code === code)
}

export function getLocaleFontFamily(code: SupportedLocaleCode): LocaleFontFamily {
  return getLocaleByCode(code)?.fontFamily ?? 'latin'
}

export function isSupportedLocaleCode(
  code: string | null | undefined
): code is SupportedLocaleCode {
  return typeof code === 'string' && SUPPORTED_CODES.has(code)
}

export function isLocalePreference(value: string | null | undefined): value is LocalePreference {
  return value === SYSTEM_LOCALE_PREFERENCE || isSupportedLocaleCode(value)
}

export function normalizeLocalePreference(value: string | null | undefined): LocalePreference {
  return isLocalePreference(value) ? value : SYSTEM_LOCALE_PREFERENCE
}

function normalizeTag(tag: string): string {
  return tag.trim().replace(/_/g, '-')
}

function resolveSystemLocaleTag(tag: string): SupportedLocaleCode | null {
  const normalized = normalizeTag(tag)
  if (!normalized) return null

  if (isSupportedLocaleCode(normalized)) return normalized

  const lower = normalized.toLowerCase()
  if (lower === 'en' || lower.startsWith('en-')) return 'en-US'
  if (lower === 'ja' || lower.startsWith('ja-')) return 'ja-JP'
  if (lower === 'ko' || lower.startsWith('ko-')) return 'ko-KR'
  if (lower === 'fr' || lower.startsWith('fr-')) return 'fr-FR'
  if (lower === 'de' || lower.startsWith('de-')) return 'de-DE'
  if (lower === 'it' || lower.startsWith('it-')) return 'it-IT'
  if (lower === 'pt' || lower.startsWith('pt-')) return 'pt-BR'
  if (lower === 'es' || lower.startsWith('es-')) {
    return lower === 'es-es' ? 'es-ES' : 'es-419'
  }
  if (lower === 'zh' || lower.includes('hans') || lower === 'zh-cn' || lower === 'zh-sg') {
    return 'zh-CN'
  }
  if (lower.includes('hant') || lower === 'zh-tw' || lower === 'zh-hk' || lower === 'zh-mo') {
    return 'zh-TW'
  }

  return null
}

export function resolveLocalePreference(
  preference: string | null | undefined,
  systemLocales: readonly string[]
): SupportedLocaleCode {
  if (isSupportedLocaleCode(preference)) return preference

  if (preference !== SYSTEM_LOCALE_PREFERENCE && preference != null) {
    return DEFAULT_LOCALE
  }

  for (const tag of systemLocales) {
    const resolved = resolveSystemLocaleTag(tag)
    if (resolved) return resolved
  }

  return DEFAULT_LOCALE
}

export function resolveActiveLocalePreference(
  preference: string | null | undefined,
  systemLocales: readonly string[]
): SupportedLocaleCode {
  if (!isMultiLangEnabled) return DEFAULT_LOCALE
  return resolveLocalePreference(preference, systemLocales)
}
