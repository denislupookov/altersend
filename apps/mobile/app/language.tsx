import {
  LOCALE_OPTIONS,
  changeI18nLanguage,
  normalizeLocalePreference,
  resolveLocalePreference,
  useTranslation,
  type LocalePreference
} from '@altersend/i18n'
import { useTheme } from '@altersend/components'
import { CheckIcon } from '@altersend/components/icons'
import { Layout } from '@/src/components'
import {
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
  const [preference, setPreference] = useState<LocalePreference>('system')

  useEffect(() => {
    let mounted = true
    void getSavedLocalePreference().then((saved) => {
      if (mounted) setPreference(saved)
    })
    return () => {
      mounted = false
    }
  }, [])

  const handleSelect = (value: string) => {
    const next = normalizeLocalePreference(value)
    setPreference(next)
    void setSavedLocalePreference(next)
    void changeI18nLanguage(resolveLocalePreference(next, getMobileSystemLocales()))
    router.back()
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
                onPress={() => handleSelect(option.preference)}
                style={({ pressed }) => [
                  styles.row,
                  pressed && { backgroundColor: theme.colors.colorSurfacePrimary }
                ]}
              >
                <View style={styles.rowText}>
                  <Text style={[styles.label, { color: theme.colors.colorTextPrimary }]}>
                    {option.nativeName ?? t('common:labels.systemDefault')}
                  </Text>
                  {option.nativeName ? (
                    <Text style={[styles.hint, { color: theme.colors.colorTextMuted }]}>
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
    fontWeight: '500'
  },
  hint: {
    fontSize: 12
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    marginLeft: 16
  }
})
