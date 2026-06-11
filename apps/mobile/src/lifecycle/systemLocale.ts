import { DEFAULT_LOCALE } from '@altersend/locales'
import { getLocales } from 'expo-localization'

export function getMobileSystemLocales(): string[] {
  const locales = getLocales()
  const tags = locales.map((locale) => locale.languageTag).filter(Boolean)
  return tags.length > 0 ? tags : [DEFAULT_LOCALE]
}
