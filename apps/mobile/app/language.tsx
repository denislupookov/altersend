import {
  LOCALE_OPTIONS,
  changeI18nLanguage,
  getLocaleFontFamily,
  isMultiLangEnabled,
  normalizeLocalePreference,
  resolveActiveLocalePreference,
  useTranslation,
  type LocaleOption,
  type LocalePreference,
  type SupportedLocaleCode
} from '@altersend/locales'
import { getNativeFontFamilyName, useTheme } from '@altersend/components'
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
import { Pressable, StyleSheet, View } from 'react-native'
import { Text } from '@/src/components/ThemedText'

export default function LanguageScreen() {
  const { t } = useTranslation(['settings', 'common'])
  const { theme } = useTheme()
  const router = useRouter()
  const [preference, setPreference] = useState<LocalePreference>(getLocalePreferenceSnapshot)

  useEffect(() => {
    if (!isMultiLangEnabled) {
      router.back()
      return
    }

    let mounted = true
    void getSavedLocalePreference().then((saved) => {
      if (mounted) setPreference(saved)
    })
    return () => {
      mounted = false
    }
  }, [router])

  if (!isMultiLangEnabled) return null

  const handleSelect = async (value: string) => {
    const next = normalizeLocalePreference(value)
    const resolvedLocale = resolveActiveLocalePreference(next, getMobileSystemLocales())
    setPreference(next)
    await setSavedLocalePreference(next)
    router.back()
    scheduleLanguageChange(resolvedLocale)
  }

  const cardStyle = {
    backgroundColor: theme.colors.colorBackgroundSubtle,
    borderColor: theme.colors.colorBorderPrimary
  }

  return (
    <Layout
      title={t('settings:languageTitle')}
      description={t('settings:languageHint')}
      hasNativeHeader
    >
      <View style={[styles.card, cardStyle]}>
        {LOCALE_OPTIONS.map((option, index) => {
          const selected = option.preference === preference
          return (
            <View key={option.preference}>
              <Pressable
                accessibilityRole='button'
                accessibilityState={{ selected }}
                onPress={() => void handleSelect(option.preference)}
                style={({ pressed }) => [
                  styles.row,
                  pressed && { backgroundColor: theme.colors.colorSurfacePrimary }
                ]}
              >
                <View style={styles.rowText}>
                  <Text
                    style={[
                      styles.label,
                      {
                        color: theme.colors.colorTextPrimary,
                        fontFamily: getOptionNativeNameFontFamily(option)
                      }
                    ]}
                  >
                    {option.nativeName ?? t('common:labels.systemDefault')}
                  </Text>
                  {option.nativeName ? (
                    <Text
                      style={[
                        styles.hint,
                        {
                          color: theme.colors.colorTextMuted
                        }
                      ]}
                    >
                      {option.label}
                    </Text>
                  ) : null}
                </View>
                {selected && <CheckIcon size={18} color={theme.colors.colorTextPrimary} />}
              </Pressable>
              {index < LOCALE_OPTIONS.length - 1 && (
                <View
                  style={[styles.divider, { backgroundColor: theme.colors.colorBorderPrimary }]}
                />
              )}
            </View>
          )
        })}
      </View>
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

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden'
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 13
  },
  rowText: {
    flex: 1,
    gap: 2
  },
  label: {
    fontSize: 15,
    includeFontPadding: false,
    lineHeight: 20
  },
  hint: {
    fontSize: 12,
    includeFontPadding: false,
    lineHeight: 16
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    marginLeft: 16
  }
})
