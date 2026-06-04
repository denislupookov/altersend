import i18next, { type i18n, type Resource } from 'i18next'
import { initReactI18next } from 'react-i18next'
import { DEFAULT_LOCALE, type SupportedLocaleCode } from './locale'
import { RESOURCES } from './resources'

export const i18nextInstance: i18n = i18next.createInstance()

let initPromise: Promise<void> | null = null

export function initI18n(locale: SupportedLocaleCode = DEFAULT_LOCALE): Promise<i18n> {
  if (!initPromise) {
    initPromise = i18nextInstance
      .use(initReactI18next)
      .init({
        resources: RESOURCES as unknown as Resource,
        lng: locale,
        fallbackLng: DEFAULT_LOCALE,
        defaultNS: 'common',
        ns: Object.keys(RESOURCES[DEFAULT_LOCALE]),
        interpolation: { escapeValue: false },
        react: { useSuspense: false }
      })
      .then(() => undefined)
  }

  const pendingInit = initPromise!
  return pendingInit.then(async () => {
    if (i18nextInstance.language !== locale) {
      await i18nextInstance.changeLanguage(locale)
    }
    return i18nextInstance
  })
}

export async function changeI18nLanguage(locale: SupportedLocaleCode): Promise<void> {
  await initI18n(locale)
  await i18nextInstance.changeLanguage(locale)
}
