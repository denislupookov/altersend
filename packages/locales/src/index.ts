import { useTranslation as useReactTranslation } from 'react-i18next'
import { i18nextInstance } from './i18n'
export { Trans } from 'react-i18next'
export * from './i18n'
export * from './locale'
export * from './resources'
export type { Resources } from './i18n-augmentation'

type TranslationOptions = Record<string, unknown>
type Translator = (key: string, options?: TranslationOptions) => string

export function translate(key: string, options?: TranslationOptions): string {
  return (i18nextInstance.t as unknown as Translator)(key, options)
}

export function useTranslation(namespaces?: string | string[]) {
  const { t, i18n, ready } = useReactTranslation(namespaces as never)

  return {
    t: t as unknown as Translator,
    i18n,
    ready
  }
}
