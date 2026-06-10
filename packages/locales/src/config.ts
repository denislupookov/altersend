import i18next from 'i18next'
import { initReactI18next } from 'react-i18next'
import common from './locales/en-US/common.json'
import send from './locales/en-US/send.json'
import { getInitialLocale } from './utils'

const resources = {
  'en-US': {
    common,
    send
  }
}

// Resources are bundled (no async backend), so v26 initializes synchronously.
// `useSuspense: false` keeps React Native from suspending on a translation read;
// react-i18next re-renders consumers once initialization settles regardless.
void i18next
  .use(initReactI18next)
  .init({
    resources,
    lng: getInitialLocale(),
    fallbackLng: 'en-US',
    ns: ['common', 'send'],
    defaultNS: 'common',
    interpolation: { escapeValue: false },
    react: { useSuspense: false }
  })
  .catch((error) => {
    console.error('i18next initialization failed', error)
  })

export default i18next
