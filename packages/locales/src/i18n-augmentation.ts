import common from './locales/en-US/common.json'
import send from './locales/en-US/send.json'

/**
 * Shape of the bundled English resources, used as the source of truth for
 * compile-time key checking of `t(...)`.
 *
 * This lives in a real `.ts` module (not an ambient `.d.ts`) and is re-exported
 * from `index.ts` so the `declare module` augmentation below is emitted to
 * `dist` and actually reaches consumers (`domain`, the apps). An input `.d.ts`
 * is not copied to `dist` by `tsc`, so the augmentation would otherwise apply
 * only inside this package and silently provide no safety downstream.
 */
export interface Resources {
  common: typeof common
  send: typeof send
}

declare module 'i18next' {
  interface CustomTypeOptions {
    defaultNS: 'common'
    resources: Resources
  }
}
