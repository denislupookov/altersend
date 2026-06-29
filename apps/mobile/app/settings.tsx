import { Image, Linking, StyleSheet, View } from 'react-native'
import Constants from 'expo-constants'
import { useCallback, useEffect, useState } from 'react'
import { useFocusEffect, useRouter } from 'expo-router'
import { LOCALE_OPTIONS, useTranslation, type LocalePreference } from '@altersend/locales'
import {
  discordUrl,
  loadPeers,
  privacyPolicyUrl,
  supportEmail,
  termsOfServiceUrl,
  useTransferStore,
  websiteUrl
} from '@altersend/domain'
import { LinkCard, LinkRow, useTheme } from '@altersend/components'
import {
  AlertCircleIcon,
  DiscordIcon,
  FileTextIcon,
  GlobeIcon,
  LockIcon,
  MailIcon,
  ShieldIcon,
  SmartphoneIcon
} from '@altersend/components/icons'
import { Layout } from '@/src/components'
import brandLogo from '@/assets/images/brand-logo.png'
import {
  getLocalePreferenceSnapshot,
  getSavedLocalePreference,
  subscribeLocalePreference
} from '@/src/lifecycle/localePreferenceStorage'
import { Text } from '@/src/components/ThemedText'

export default function SettingsScreen() {
  const { t } = useTranslation(['settings', 'common'])
  const { theme } = useTheme()
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

  const openUrl = (url: string) => {
    void Linking.openURL(url).catch(() => {})
  }

  return (
    <Layout title={t('settings:title')} description='' hasNativeHeader>
      <View style={styles.content}>
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.colorTextMuted }]}>
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
              icon={<SmartphoneIcon size={16} color={theme.colors.colorTextSecondary} />}
              onPress={() => router.push('/devices')}
            />
            <LinkRow
              label={t('common:labels.language')}
              subtitle={
                LOCALE_OPTIONS.find((option) => option.preference === localePreference)
                  ?.nativeName ?? t('common:labels.systemDefault')
              }
              icon={<GlobeIcon size={16} color={theme.colors.colorTextSecondary} />}
              onPress={() => router.push('/language')}
            />
            <LinkRow
              label={t('settings:rows.security')}
              subtitle={t('settings:crashReports.label')}
              icon={<ShieldIcon size={16} color={theme.colors.colorTextSecondary} />}
              onPress={() => router.push('/security')}
              isLast
            />
          </LinkCard>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.colorTextMuted }]}>
            {t('settings:sections.support')}
          </Text>
          <LinkCard>
            <LinkRow
              label={t('settings:rows.feedback')}
              subtitle={t('settings:rows.feedbackHint')}
              icon={<AlertCircleIcon size={16} color={theme.colors.colorTextSecondary} />}
              onPress={() => router.push('/report')}
            />
            <LinkRow
              label={t('settings:rows.discord')}
              subtitle={t('settings:rows.discordHint')}
              icon={<DiscordIcon size={16} color={theme.colors.colorTextSecondary} />}
              onPress={() => openUrl(discordUrl)}
            />
            <LinkRow
              label={t('settings:rows.contact')}
              subtitle={supportEmail}
              icon={<MailIcon size={16} color={theme.colors.colorTextSecondary} />}
              onPress={() => openUrl(`mailto:${supportEmail}`)}
              isLast
            />
          </LinkCard>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.colorTextMuted }]}>
            {t('settings:sections.about')}
          </Text>
          <LinkCard>
            <LinkRow
              label={t('settings:rows.privacyPolicy')}
              subtitle={t('settings:rows.privacyPolicyHint')}
              icon={<LockIcon size={16} color={theme.colors.colorTextSecondary} />}
              onPress={() => openUrl(privacyPolicyUrl)}
            />
            <LinkRow
              label={t('settings:rows.terms')}
              subtitle={t('settings:rows.termsHint')}
              icon={<FileTextIcon size={16} color={theme.colors.colorTextSecondary} />}
              onPress={() => openUrl(termsOfServiceUrl)}
            />
            <LinkRow
              label={t('settings:rows.website')}
              subtitle={websiteUrl.replace(/^https?:\/\//, '')}
              icon={<GlobeIcon size={16} color={theme.colors.colorTextSecondary} />}
              onPress={() => openUrl(websiteUrl)}
              isLast
            />
          </LinkCard>
        </View>

        <View
          style={[
            styles.brandRow,
            {
              backgroundColor: theme.colors.colorBackgroundSubtle,
              borderColor: theme.colors.colorBorderPrimary
            }
          ]}
        >
          <Image source={brandLogo} style={styles.brandLogo} resizeMode='contain' />
          <View style={styles.brandInfo}>
            <Text style={[styles.brandName, { color: theme.colors.colorTextPrimary }]}>
              AlterSend
            </Text>
            <Text style={[styles.brandTagline, { color: theme.colors.colorTextMuted }]}>
              {t('common:app.tagline')}
            </Text>
          </View>
          <View style={[styles.versionChip, { backgroundColor: theme.colors.colorSurfacePrimary }]}>
            <Text style={[styles.versionText, { color: theme.colors.colorTextMuted }]}>
              v{version}
            </Text>
          </View>
        </View>
      </View>
    </Layout>
  )
}

const styles = StyleSheet.create({
  content: {
    gap: 16
  },
  section: {
    gap: 6
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    paddingHorizontal: 4
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 13
  },
  brandLogo: {
    width: 34,
    height: 34
  },
  brandInfo: {
    flex: 1,
    gap: 1
  },
  brandName: {
    fontSize: 13,
    fontWeight: '600',
    lineHeight: 18
  },
  brandTagline: {
    fontSize: 12,
    lineHeight: 16
  },
  versionChip: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 20
  },
  versionText: {
    fontSize: 11,
    fontWeight: '500'
  }
})
