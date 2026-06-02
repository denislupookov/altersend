import i18next from 'i18next'
import common from '../locales/en/common.json'
import send from '../locales/en/send.json'

const resources = {
  en: {
    common,
    send
  }
}

i18next.init({
  resources,
  lng: 'en',
  fallbackLng: 'en',
  ns: ['common', 'send'],
  defaultNS: 'common',
  interpolation: { escapeValue: false }
})

export default i18next
