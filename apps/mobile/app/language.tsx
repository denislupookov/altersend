import {
  LOCALE_OPTIONS,
  changeI18nLanguage,
  getLocaleFontFamily,
  normalizeLocalePreference,
  resolveLocalePreference,
  useTranslation,
  type LocaleOption,
  type LocalePreference,
  type SupportedLocaleCode
} from '@altersend/locales'
import { LinkCard, LinkRow, getNativeFontFamilyName, useTheme } from '@altersend/components'
import { CheckIcon } from '@altersend/components/icons'
import { Layout } from '@/src/components'
import {
  getLocalePreferenceSnapshot,
  getSavedLocalePreference,
  setSavedLocalePreference
} from '@/src/lifecycle/localePreferenceStorage'
import { getMobileSystemLocales } from '@/src/lifecycle/systemLocale'
import { useRouter } from 'expo-router'
import { useEffect, useState } from 'react'

export default function LanguageScreen() {
  const { t } = useTranslation(['settings', 'common'])
  const { theme } = useTheme()
  const router = useRouter()
  const [preference, setPreference] = useState<LocalePreference>(getLocalePreferenceSnapshot)

  useEffect(() => {
    let mounted = true
    void getSavedLocalePreference().then((saved) => {
      if (mounted) setPreference(saved)
    })
    return () => {
      mounted = false
    }
  }, [])

  const handleSelect = async (value: string) => {
    const next = normalizeLocalePreference(value)
    const resolvedLocale = resolveLocalePreference(next, getMobileSystemLocales())
    setPreference(next)
    await setSavedLocalePreference(next)
    router.back()
    scheduleLanguageChange(resolvedLocale)
  }

  return (
    <Layout
      title={t('settings:languageTitle')}
      description={t('settings:languageHint')}
      hasNativeHeader
    >
      <LinkCard>
        {LOCALE_OPTIONS.map((option, index) => {
          const selected = option.preference === preference
          return (
            <LinkRow
              key={option.preference}
              label={option.nativeName ?? t('common:labels.systemDefault')}
              labelFontFamily={getOptionNativeNameFontFamily(option)}
              subtitle={option.nativeName ? option.label : undefined}
              trailing={
                selected ? <CheckIcon size={18} color={theme.colors.colorTextPrimary} /> : null
              }
              onPress={() => void handleSelect(option.preference)}
              isLast={index === LOCALE_OPTIONS.length - 1}
            />
          )
        })}
      </LinkCard>
    </Layout>
  )
}

function scheduleLanguageChange(resolvedLocale: SupportedLocaleCode) {
  const changeLanguage = () => {
    void changeI18nLanguage(resolvedLocale)
  }

  if (typeof requestIdleCallback === 'function') {
    requestIdleCallback(changeLanguage)
    return
  }

  requestAnimationFrame(changeLanguage)
}

function getOptionNativeNameFontFamily(option: LocaleOption) {
  if (!option.resolvedCode) return undefined
  return getNativeFontFamilyName(getLocaleFontFamily(option.resolvedCode))
}
