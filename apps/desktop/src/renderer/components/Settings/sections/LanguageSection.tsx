import { useState } from 'react'
import { LinkCard, LinkRow, getFontFamilyCssVariables, useTheme } from '@altersend/components'
import { CheckIcon } from '@altersend/components/icons'
import {
  LOCALE_OPTIONS,
  changeI18nLanguage,
  getLocaleFontFamily,
  normalizeLocalePreference,
  resolveLocalePreference,
  useTranslation,
  type LocaleOption,
  type LocalePreference
} from '@altersend/locales'
import {
  getSavedLocalePreference,
  setSavedLocalePreference
} from '../../../lifecycle/localePreferenceStorage'
import { getDesktopSystemLocales } from '../../../lifecycle/systemLocale'
import { SectionShell } from './SectionShell'

function getLocaleOptionFontFamily(option: LocaleOption): string | undefined {
  if (!option.resolvedCode) return undefined
  return getFontFamilyCssVariables(getLocaleFontFamily(option.resolvedCode)).fontFamily
}

export function LanguageSection() {
  const { t } = useTranslation(['settings', 'common'])
  const { theme } = useTheme()
  const c = theme.colors
  const [localePreference, setLocalePreference] =
    useState<LocalePreference>(getSavedLocalePreference)

  const handleLocaleChange = (value: string) => {
    const preference = normalizeLocalePreference(value)
    setLocalePreference(preference)
    setSavedLocalePreference(preference)
    changeI18nLanguage(resolveLocalePreference(preference, getDesktopSystemLocales()))
  }

  return (
    <SectionShell title={t('settings:languageTitle')}>
      <LinkCard>
        {LOCALE_OPTIONS.map((option, index) => {
          const isSelected = option.preference === localePreference
          return (
            <LinkRow
              key={option.preference}
              compact
              label={option.nativeName ?? t('common:labels.systemDefault')}
              labelFontFamily={getLocaleOptionFontFamily(option)}
              subtitle={option.nativeName ? option.label : undefined}
              trailing={isSelected ? <CheckIcon size={16} color={c.colorTextPrimary} /> : null}
              onPress={() => handleLocaleChange(option.preference)}
              isLast={index === LOCALE_OPTIONS.length - 1}
            />
          )
        })}
      </LinkCard>
    </SectionShell>
  )
}
