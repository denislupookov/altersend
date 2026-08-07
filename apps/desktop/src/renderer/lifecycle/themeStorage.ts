import {
  SYSTEM_THEME_PREFERENCE,
  normalizeThemePreference,
  type ThemePreference
} from '@altersend/components'

const KEY = 'altersend.theme.preference'

export function getSavedThemePreference(): ThemePreference {
  try {
    return normalizeThemePreference(window.localStorage.getItem(KEY))
  } catch {
    return SYSTEM_THEME_PREFERENCE
  }
}

export function setSavedThemePreference(preference: ThemePreference): void {
  try {
    window.localStorage.setItem(KEY, preference)
  } catch (error) {
    console.warn('themeStorage: setSavedThemePreference failed', error)
  }
}
