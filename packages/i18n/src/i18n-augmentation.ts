import common from './locales/en-US/common.json'
import errors from './locales/en-US/errors.json'
import feedback from './locales/en-US/feedback.json'
import native from './locales/en-US/native.json'
import onboarding from './locales/en-US/onboarding.json'
import receive from './locales/en-US/receive.json'
import send from './locales/en-US/send.json'
import settings from './locales/en-US/settings.json'

export interface Resources {
  common: typeof common
  errors: typeof errors
  feedback: typeof feedback
  native: typeof native
  onboarding: typeof onboarding
  receive: typeof receive
  send: typeof send
  settings: typeof settings
}

declare module 'i18next' {
  interface CustomTypeOptions {
    defaultNS: 'common'
    resources: Resources
  }
}
