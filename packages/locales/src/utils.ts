import { DEFAULT_LANGUAGE, PICKABLE_LANGUAGES, type LocalePreference } from './languages'

/**
 * Best-effort detection of the user's preferred UI language as a raw BCP-47
 * tag. Prefers `navigator.languages` (the ordered UI-language preference on
 * web/Electron) and falls back to the `Intl` resolved locale (a regional
 * formatting locale, and unreliable on Hermes — mobile passes the device tag
 * from `expo-localization` to {@link resolveSupportedLocale} instead).
 */
function getSystemPreferredLocale(): string {
  if (typeof navigator !== 'undefined') {
    const fromNavigator = navigator.languages?.[0] ?? navigator.language
    if (fromNavigator) return fromNavigator
  }
  if (typeof Intl !== 'undefined' && typeof Intl.DateTimeFormat === 'function') {
    const resolved = Intl.DateTimeFormat().resolvedOptions().locale
    if (resolved) return resolved
  }
  return DEFAULT_LANGUAGE
}

/**
 * Maps any BCP-47 tag to the nearest production-ready language code, falling
 * back to {@link DEFAULT_LANGUAGE}. This is the single guard that keeps the
 * store/i18next from ever holding an unsupported or not-yet-ready locale
 * (e.g. `en-US` → `en`, `pt-PT` → `en` while pt-BR is not ready).
 */
export function resolveSupportedLocale(tag: string | null | undefined): string {
  const normalized = tag?.trim().toLowerCase()
  if (!normalized) return DEFAULT_LANGUAGE

  const exact = PICKABLE_LANGUAGES.find((l) => l.code.toLowerCase() === normalized)
  if (exact) return exact.code

  const base = normalized.split('-')[0]
  if (base) {
    const byBase = PICKABLE_LANGUAGES.find((l) => l.code.toLowerCase().split('-')[0] === base)
    if (byBase) return byBase.code
  }

  return DEFAULT_LANGUAGE
}

import i18nextInstance from './config'

/** Production-ready locale to boot with, derived from system preference or user choice. */
export function getInitialLocale(preference: LocalePreference | 'system' = 'system'): string {
  if (preference === 'system') return resolveSupportedLocale(getSystemPreferredLocale())
  return resolveSupportedLocale(preference)
}

/**
 * Switches the active language. The requested tag is normalized to a
 * production-ready code (so a stale/persisted/unsupported value can never put
 * the app in an undefined locale state) and i18next is told to change language.
 */
export const changeLocale = async (locale: string): Promise<void> => {
  const resolved = resolveSupportedLocale(locale)
  try {
    await i18nextInstance.changeLanguage(resolved)
  } catch (error) {
    console.error('Failed to change language:', error)
    throw error
  }
}
