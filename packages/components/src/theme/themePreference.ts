import { ThemeType } from './types'

export const SYSTEM_THEME_PREFERENCE = 'system'

export type ThemePreference = typeof SYSTEM_THEME_PREFERENCE | ThemeType

export const THEME_PREFERENCE_OPTIONS = [
  ThemeType.Light,
  ThemeType.Dark,
  SYSTEM_THEME_PREFERENCE
] as const

export function normalizeThemePreference(value: string | null | undefined): ThemePreference {
  if (value === ThemeType.Light || value === ThemeType.Dark) return value
  return SYSTEM_THEME_PREFERENCE
}

export function resolveThemePreference(
  preference: ThemePreference,
  systemTheme: ThemeType
): ThemeType {
  return preference === SYSTEM_THEME_PREFERENCE ? systemTheme : preference
}
