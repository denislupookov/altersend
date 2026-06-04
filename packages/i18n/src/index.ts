import { useTranslation as useReactTranslation } from 'react-i18next'
export { Trans } from 'react-i18next'
export * from './i18n'
export * from './locale'
export * from './resources'
export type { Resources } from './i18n-augmentation'

type TranslationOptions = Record<string, unknown>

export function useTranslation(namespaces?: string | string[]) {
  const { t, i18n, ready } = useReactTranslation(namespaces as never)
  const translate = t as unknown as (key: string, options?: TranslationOptions) => string

  return {
    t: translate,
    i18n,
    ready
  }
}
