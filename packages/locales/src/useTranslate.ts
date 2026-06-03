import { useCallback, useEffect, useState } from 'react'
import i18n from './config'
import type { TOptions, i18n as I18nType } from 'i18next'

export function useTranslate(): { t: (key: string, options?: TOptions) => string; i18n: I18nType } {
  const [, setTick] = useState(0)

  useEffect(() => {
    const handler = () => setTick((t) => t + 1)
    i18n.on('languageChanged', handler)
    return () => i18n.off('languageChanged', handler)
  }, [])

  const t = useCallback((key: string, options?: TOptions) => String(i18n.t(key, options)), [])
  return { t, i18n }
}
