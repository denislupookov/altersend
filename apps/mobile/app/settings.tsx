import { Image, Linking, Pressable, StyleSheet, View } from 'react-native'
import Constants from 'expo-constants'
import { useCallback, useEffect, useState } from 'react'
import { useFocusEffect, useRouter } from 'expo-router'
import {
  LOCALE_OPTIONS,
  isMultiLangEnabled,
  useTranslation,
  type LocalePreference
} from '@altersend/locales'
import {
  discordUrl,
  privacyPolicyUrl,
  supportEmail,
  termsOfServiceUrl,
  websiteUrl
} from '@altersend/domain'
import { ToggleSwitch, useTheme } from '@altersend/components'
import {
  AlertCircleIcon,
  ChevronRightIcon,
  DiscordIcon,
  FileTextIcon,
  GlobeIcon,
  LockIcon,
  MailIcon
} from '@altersend/components/icons'
import { Layout } from '@/src/components'
import brandLogo from '@/assets/images/brand-logo.png'
import {
  getLocalePreferenceSnapshot,
  getSavedLocalePreference,
  subscribeLocalePreference
} from '@/src/lifecycle/localePreferenceStorage'
import {
  isCrashReportingEnabled,
  setCrashReportingEnabled
} from '@/src/lifecycle/crashReportingStorage'
import { closeSentry, initSentry } from '@/src/sentry'
import { Text } from '@/src/components/ThemedText'

interface LinkRowProps {
  label: string
  hint: string
  icon: React.ReactNode
  onPress: () => void
  isLast?: boolean
}

function LinkRow({ label, hint, icon, onPress, isLast }: LinkRowProps) {
  const { theme } = useTheme()
  return (
    <>
      <Pressable
        accessibilityRole='link'
        accessibilityLabel={label}
        onPress={onPress}
        style={({ pressed }) => [
          styles.row,
          pressed && { backgroundColor: theme.colors.colorSurfacePrimary }
        ]}
      >
        <View style={[styles.rowIcon, { backgroundColor: theme.colors.colorSurfacePrimary }]}>
          {icon}
        </View>
        <View style={styles.rowText}>
          <Text style={[styles.rowLabel, { color: theme.colors.colorTextPrimary }]}>{label}</Text>
          <Text style={[styles.rowHint, { color: theme.colors.colorTextMuted }]} numberOfLines={1}>
            {hint}
          </Text>
        </View>
        <ChevronRightIcon size={14} color={theme.colors.colorTextMuted} />
      </Pressable>
      {!isLast && (
        <View style={[styles.divider, { backgroundColor: theme.colors.colorBorderPrimary }]} />
      )}
    </>
  )
}

export default function SettingsScreen() {
  const { t } = useTranslation(['settings', 'common'])
  const { theme } = useTheme()
  const router = useRouter()
  const version = Constants.expoConfig?.version ?? '0.0.0'
  const [crashReporting, setCrashReporting] = useState(isCrashReportingEnabled)
  const [localePreference, setLocalePreference] = useState<LocalePreference>(
    getLocalePreferenceSnapshot
  )

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

  const handleCrashReportingToggle = (value: boolean) => {
    setCrashReporting(value)
    setCrashReportingEnabled(value)
    if (value) initSentry()
    else closeSentry()
  }

  const openUrl = (url: string) => {
    void Linking.openURL(url).catch(() => {})
  }

  const cardStyle = {
    backgroundColor: theme.colors.colorBackgroundSubtle,
    borderColor: theme.colors.colorBorderPrimary
  }

  return (
    <Layout title={t('settings:title')} description='' hasNativeHeader>
      <View style={styles.content}>
        {isMultiLangEnabled && (
          <View style={styles.section}>
            <View style={[styles.card, cardStyle]}>
              <LinkRow
                label={t('common:labels.language')}
                hint={
                  LOCALE_OPTIONS.find((option) => option.preference === localePreference)
                    ?.nativeName ?? t('common:labels.systemDefault')
                }
                icon={<GlobeIcon size={16} color={theme.colors.colorTextSecondary} />}
                onPress={() => router.push('/language')}
                isLast
              />
            </View>
          </View>
        )}

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.colorTextMuted }]}>
            {t('settings:sections.privacy')}
          </Text>
          <View style={[styles.card, styles.toggleCardPad, cardStyle]}>
            <ToggleSwitch
              checked={crashReporting}
              onChange={handleCrashReportingToggle}
              label={t('settings:crashReports.label')}
              description={t('settings:crashReports.description')}
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.colorTextMuted }]}>
            {t('settings:sections.support')}
          </Text>
          <View style={[styles.card, cardStyle]}>
            <LinkRow
              label={t('settings:rows.feedback')}
              hint={t('settings:rows.feedbackHint')}
              icon={<AlertCircleIcon size={16} color={theme.colors.colorTextSecondary} />}
              onPress={() => router.push('/report')}
            />
            <LinkRow
              label={t('settings:rows.discord')}
              hint={t('settings:rows.discordHint')}
              icon={<DiscordIcon size={16} color={theme.colors.colorTextSecondary} />}
              onPress={() => openUrl(discordUrl)}
            />
            <LinkRow
              label={t('settings:rows.contact')}
              hint={supportEmail}
              icon={<MailIcon size={16} color={theme.colors.colorTextSecondary} />}
              onPress={() => openUrl(`mailto:${supportEmail}`)}
              isLast
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.colorTextMuted }]}>
            {t('settings:sections.about')}
          </Text>
          <View style={[styles.card, cardStyle]}>
            <LinkRow
              label={t('settings:rows.privacyPolicy')}
              hint={t('settings:rows.privacyPolicyHint')}
              icon={<LockIcon size={16} color={theme.colors.colorTextSecondary} />}
              onPress={() => openUrl(privacyPolicyUrl)}
            />
            <LinkRow
              label={t('settings:rows.terms')}
              hint={t('settings:rows.termsHint')}
              icon={<FileTextIcon size={16} color={theme.colors.colorTextSecondary} />}
              onPress={() => openUrl(termsOfServiceUrl)}
            />
            <LinkRow
              label={t('settings:rows.website')}
              hint={websiteUrl.replace(/^https?:\/\//, '')}
              icon={<GlobeIcon size={16} color={theme.colors.colorTextSecondary} />}
              onPress={() => openUrl(websiteUrl)}
              isLast
            />
          </View>
        </View>

        <View style={[styles.brandRow, cardStyle]}>
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
  card: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden'
  },
  toggleCardPad: {
    paddingHorizontal: 16,
    paddingVertical: 13
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 13
  },
  rowIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center'
  },
  rowText: {
    flex: 1,
    gap: 0
  },
  rowLabel: {
    fontSize: 14,
    fontWeight: '500',
    lineHeight: 18
  },
  rowHint: {
    fontSize: 12,
    lineHeight: 16
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    marginLeft: 60
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
    width: 28,
    height: 28
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
