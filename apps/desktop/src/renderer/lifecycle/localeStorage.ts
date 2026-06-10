import type { LocalePreference } from '@altersend/locales'

const KEY = 'altersend.locale'

export function getSavedLocale(): LocalePreference | null {
  try {
    return window.localStorage.getItem(KEY) as LocalePreference | null
  } catch {
    return null
  }
}

export function setSavedLocale(locale: LocalePreference): void {
  try {
    window.localStorage.setItem(KEY, locale)
  } catch {}
}
