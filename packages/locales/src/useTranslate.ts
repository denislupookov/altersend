import { useCallback, useSyncExternalStore } from 'react'
import i18n from './config'
import type { TOptions, i18n as I18nType } from 'i18next'

function subscribe(callback: () => void) {
  i18n.on('languageChanged', callback)
  i18n.on('loaded', callback)
  i18n.on('storeLoaded', callback)
  return () => {
    i18n.off('languageChanged', callback)
    i18n.off('loaded', callback)
    i18n.off('storeLoaded', callback)
  }
}

function getSnapshot() {
  return i18n.language
}

export function useTranslate(): { t: (key: string, options?: TOptions) => string; i18n: I18nType } {
  useSyncExternalStore(subscribe, getSnapshot, getSnapshot)

  const t = useCallback((key: string, options?: TOptions) => String(i18n.t(key, options)), [])
  return { t, i18n }
}
