import { i18nextInstance, isRTL, resolveSupportedLocale } from '@altersend/locales'
import { settingsStore } from './store'

/**
 * Switches the active language. The requested tag is normalized to a
 * production-ready code (so a stale/persisted/unsupported value can never put
 * the app in an undefined locale state), the store is updated, and i18next is
 * told to change language.
 */
export const changeLocale = async (locale: string): Promise<void> => {
  const resolved = resolveSupportedLocale(locale)
  settingsStore.setState({ locale: resolved, isRTL: isRTL(resolved) })
  try {
    await i18nextInstance.changeLanguage(resolved)
  } catch (error) {
    console.error('Failed to change language:', error)
  }
}
