import { useState, type ChangeEvent } from 'react'
import { useTheme } from '@altersend/components'
import { ChevronDownIcon, GlobeIcon } from '@altersend/components/icons'
import {
  DEFAULT_LOCALE,
  LOCALE_OPTIONS,
  changeI18nLanguage,
  getLocaleByCode,
  normalizeLocalePreference,
  resolveLocalePreference,
  useTranslation,
  type LocalePreference
} from '@altersend/locales'
import {
  getBrowserLocales,
  getSavedLocalePreference,
  setSavedLocalePreference
} from '../../localePreference'

export function LanguageSelect() {
  const { t, i18n } = useTranslation(['common'])
  const { theme } = useTheme()
  const [preference, setPreference] = useState<LocalePreference>(getSavedLocalePreference)

  const change = (event: ChangeEvent<HTMLSelectElement>) => {
    const next = normalizeLocalePreference(event.currentTarget.value)
    setPreference(next)
    setSavedLocalePreference(next)
    changeI18nLanguage(resolveLocalePreference(next, getBrowserLocales())).catch((error) =>
      console.warn('Failed to change locale', error)
    )
  }

  const active = getLocaleByCode(i18n.language) ?? getLocaleByCode(DEFAULT_LOCALE)

  return (
    <div className='relative inline-flex items-center gap-2 rounded-xl bg-surface-secondary px-3 py-2 transition-colors hover:bg-surface-tertiary focus-within:ring-2 focus-within:ring-focus-ring'>
      <GlobeIcon size={16} color={theme.colors.colorTextMuted} />
      <span className='text-sm font-medium text-text-primary'>{active?.nativeName}</span>
      <ChevronDownIcon size={14} color={theme.colors.colorTextMuted} />

      <select
        aria-label={t('common:labels.language')}
        value={preference}
        onChange={change}
        className='absolute inset-0 cursor-pointer opacity-0'
      >
        {LOCALE_OPTIONS.map((option) => (
          <option key={option.preference} value={option.preference}>
            {option.nativeName ?? t('common:labels.systemDefault')}
          </option>
        ))}
      </select>
    </div>
  )
}
