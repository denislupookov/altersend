import type { TOptions } from 'i18next'
import i18n from './config'

export function t(key: string, options?: TOptions): string {
  // i18next.t may return objects for some usages; coerce to string for simple lookup usage
  const res = i18n.t(key, options)
  return String(res)
}

export { default as i18nextInstance } from './config'
export * from './useTranslate'
