import { Pressable, StyleSheet, Text, View } from 'react-native'
import { useRouter } from 'expo-router'
import {
  PICKABLE_LANGUAGES,
  changeLocale,
  useTranslation,
  type LocalePreference
} from '@altersend/locales'
import { useTheme } from '@altersend/components'
import { CheckIcon } from '@altersend/components/icons'
import { Layout } from '@/src/components'
import { setSavedLocale } from '@/src/lifecycle/localeStorage'

export default function LanguageScreen() {
  const { theme } = useTheme()
  const router = useRouter()
  const { i18n } = useTranslation()
  const locale = i18n.language

  const handleSelect = async (code: string) => {
    try {
      await changeLocale(code as LocalePreference)
      void setSavedLocale(code as LocalePreference)
      router.back()
    } catch (err) {
      console.warn('Failed to change language', err)
    }
  }

  const cardStyle = {
    backgroundColor: theme.colors.colorBackgroundSubtle,
    borderColor: theme.colors.colorBorderPrimary
  }

  return (
    <Layout title='Language' description='' hasNativeHeader>
      <View style={[styles.card, cardStyle]}>
        {PICKABLE_LANGUAGES.map((language, index) => {
          const selected = language.code === locale
          return (
            <View key={language.code}>
              <Pressable
                accessibilityRole='button'
                accessibilityState={{ selected }}
                onPress={() => handleSelect(language.code)}
                style={({ pressed }) => [
                  styles.row,
                  pressed && { backgroundColor: theme.colors.colorSurfacePrimary }
                ]}
              >
                <Text style={[styles.label, { color: theme.colors.colorTextPrimary }]}>
                  {language.label}
                </Text>
                {selected && <CheckIcon size={18} color={theme.colors.colorTextPrimary} />}
              </Pressable>
              {index < PICKABLE_LANGUAGES.length - 1 && (
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
    paddingHorizontal: 16,
    paddingVertical: 15
  },
  label: {
    fontSize: 15,
    fontWeight: '500'
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    marginLeft: 16
  }
})
