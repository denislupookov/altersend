import { useCallback, useEffect, useState } from 'react'
import { StyleSheet, View } from 'react-native'
import { useFocusEffect, useRouter } from 'expo-router'
import { LOCALE_OPTIONS, useTranslation, type LocalePreference } from '@altersend/locales'
import { loadPeers, useTransferStore } from '@altersend/domain'
import { LinkCard, LinkRow, useTheme } from '@altersend/components'
import {
  AlertCircleIcon,
  GlobeIcon,
  InfoIcon,
  SlidersHorizontalIcon,
  SmartphoneIcon,
  WaypointsIcon
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
          <LinkCard>
            <LinkRow
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
              label={t('settings:sections.general')}
              icon={<SlidersHorizontalIcon size={16} color={c.colorTextSecondary} />}
              onPress={() => router.push('/general')}
            />
            <LinkRow
              label={t('common:labels.language')}
              subtitle={languageLabel}
              icon={<GlobeIcon size={16} color={c.colorTextSecondary} />}
              onPress={() => router.push('/language')}
            />
            <LinkRow
              isLast
              label={t('settings:rows.connection')}
              icon={<WaypointsIcon size={16} color={c.colorTextSecondary} />}
              onPress={() => router.push('/connection')}
            />
          </LinkCard>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: c.colorTextMuted }]}>
            {t('settings:sections.support')}
          </Text>
          <LinkCard>
            <LinkRow
              label={t('settings:rows.feedback')}
              icon={<AlertCircleIcon size={16} color={c.colorTextSecondary} />}
              onPress={() => router.push('/report')}
            />
            <LinkRow
              isLast
              label={t('settings:sections.about')}
              icon={<InfoIcon size={16} color={c.colorTextSecondary} />}
              onPress={() => router.push('/about')}
            />
          </LinkCard>
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
  }
})
