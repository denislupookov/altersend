import {
  SYSTEM_LOCALE_PREFERENCE,
  normalizeLocalePreference,
  type LocalePreference
} from '@altersend/locales'

const KEY = 'altersend.locale.preference'

export function getSavedLocalePreference(): LocalePreference {
  try {
    return normalizeLocalePreference(window.localStorage.getItem(KEY))
  } catch {
    return SYSTEM_LOCALE_PREFERENCE
  }
}

export function setSavedLocalePreference(preference: LocalePreference): void {
  try {
    window.localStorage.setItem(KEY, preference)
  } catch {}
}
