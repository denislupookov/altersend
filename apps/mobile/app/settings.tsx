import { useCallback, useEffect, useState } from 'react'
import { StyleSheet, View } from 'react-native'
import Constants from 'expo-constants'
import { useFocusEffect, useRouter } from 'expo-router'
import { LOCALE_OPTIONS, useTranslation, type LocalePreference } from '@altersend/locales'
import { loadPeers, useTransferStore } from '@altersend/domain'
import { LinkRow, useTheme } from '@altersend/components'
import {
  AlertCircleIcon,
  GlobeIcon,
  InfoIcon,
  ShieldIcon,
  SmartphoneIcon
} from '@altersend/components/icons'
import { Layout } from '@/src/components'
import { Text } from '@/src/components/ThemedText'
import {
  getLocalePreferenceSnapshot,
  getSavedLocalePreference,
  subscribeLocalePreference
} from '@/src/lifecycle/localePreferenceStorage'

export default function SettingsScreen() {
  const { t } = useTranslation(['settings', 'common'])
  const { theme } = useTheme()
  const c = theme.colors
  const router = useRouter()
  const version = Constants.expoConfig?.version ?? '0.0.0'
  const [localePreference, setLocalePreference] = useState<LocalePreference>(
    getLocalePreferenceSnapshot
  )
  const peers = useTransferStore((s) => s.peers)

  useEffect(() => {
    void loadPeers()
  }, [])

  useEffect(() => subscribeLocalePreference(setLocalePreference), [])

  useFocusEffect(
    useCallback(() => {
      let active = true
      void getSavedLocalePreference()
        .then((preference) => {
          if (active) setLocalePreference(preference)
        })
        .catch((error) => {
          console.warn('Failed to load locale preference:', error)
        })
      return () => {
        active = false
      }
    }, [])
  )

  const languageLabel =
    LOCALE_OPTIONS.find((option) => option.preference === localePreference)?.nativeName ??
    t('common:labels.systemDefault')

  return (
    <Layout title={t('settings:title')} description='' hasNativeHeader>
      <View style={styles.container}>
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: c.colorTextMuted }]}>
            {t('settings:sections.general')}
          </Text>
          <View style={styles.list}>
            <LinkRow
              standalone
              label={t('settings:pairing.pairedDevices')}
              subtitle={
                peers.length === 0
                  ? t('settings:rows.noDevices')
                  : t('settings:rows.pairedCount', { count: peers.length })
              }
              icon={<SmartphoneIcon size={16} color={c.colorTextSecondary} />}
              onPress={() => router.push('/devices')}
            />
            <LinkRow
              standalone
              label={t('common:labels.language')}
              subtitle={languageLabel}
              icon={<GlobeIcon size={16} color={c.colorTextSecondary} />}
              onPress={() => router.push('/language')}
            />
            <LinkRow
              standalone
              label={t('settings:rows.security')}
              subtitle={t('settings:crashReports.label')}
              icon={<ShieldIcon size={16} color={c.colorTextSecondary} />}
              onPress={() => router.push('/security')}
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: c.colorTextMuted }]}>
            {t('settings:sections.support')}
          </Text>
          <View style={styles.list}>
            <LinkRow
              standalone
              label={t('settings:rows.feedback')}
              subtitle={t('settings:rows.feedbackHint')}
              icon={<AlertCircleIcon size={16} color={c.colorTextSecondary} />}
              onPress={() => router.push('/report')}
            />
            <LinkRow
              standalone
              label={t('settings:sections.about')}
              subtitle={`v${version}`}
              icon={<InfoIcon size={16} color={c.colorTextSecondary} />}
              onPress={() => router.push('/about')}
            />
          </View>
        </View>
      </View>
    </Layout>
  )
}

const styles = StyleSheet.create({
  container: {
    gap: 22
  },
  section: {
    gap: 8
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    paddingHorizontal: 4
  },
  list: {
    gap: 10
  }
})
