export { default as i18nextInstance } from './config'
export { useTranslation } from 'react-i18next'
export * from './languages'
export * from './utils'
// Re-exported so the `declare module 'i18next'` augmentation in this module is
// emitted to `dist` and applied in consuming packages (typed `t` keys).
export type { Resources } from './i18n-augmentation'
