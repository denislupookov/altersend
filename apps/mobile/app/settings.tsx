import { Image, Linking, Pressable, StyleSheet, Text, View } from 'react-native'
import Constants from 'expo-constants'
import { useState } from 'react'
import { useRouter } from 'expo-router'
import {
  discordUrl,
  privacyPolicyUrl,
  supportEmail,
  termsOfServiceUrl,
  websiteUrl
} from '@altersend/domain'
import { MULTI_LANG_ENABLED, getLanguage, useTranslation } from '@altersend/locales'
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
  isCrashReportingEnabled,
  setCrashReportingEnabled
} from '@/src/lifecycle/crashReportingStorage'
import { closeSentry, initSentry } from '@/src/sentry'

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
  const { theme } = useTheme()
  const router = useRouter()
  const version = Constants.expoConfig?.version ?? '0.0.0'
  const [crashReporting, setCrashReporting] = useState(isCrashReportingEnabled)
  const { i18n } = useTranslation()
  const locale = i18n.language

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
    <Layout title='Settings' description='' hasNativeHeader>
      <View style={styles.content}>
        {MULTI_LANG_ENABLED && (
          <View style={styles.section}>
            <View style={[styles.card, cardStyle]}>
              <LinkRow
                label='Language'
                hint={getLanguage(locale)?.label ?? locale}
                icon={<GlobeIcon size={16} color={theme.colors.colorTextSecondary} />}
                onPress={() => router.push('/language')}
                isLast
              />
            </View>
          </View>
        )}

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.colorTextMuted }]}>Privacy</Text>
          <View style={[styles.card, styles.toggleCardPad, cardStyle]}>
            <ToggleSwitch
              checked={crashReporting}
              onChange={handleCrashReportingToggle}
              label='Crash reports'
              description='Share anonymous crash data to help improve AlterSend'
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.colorTextMuted }]}>Support</Text>
          <View style={[styles.card, cardStyle]}>
            <LinkRow
              label='Feedback'
              hint='Report a problem or suggest a feature'
              icon={<AlertCircleIcon size={16} color={theme.colors.colorTextSecondary} />}
              onPress={() => router.push('/report')}
            />
            <LinkRow
              label='Discord'
              hint='Join the community'
              icon={<DiscordIcon size={16} color={theme.colors.colorTextSecondary} />}
              onPress={() => openUrl(discordUrl)}
            />
            <LinkRow
              label='Contact us'
              hint={supportEmail}
              icon={<MailIcon size={16} color={theme.colors.colorTextSecondary} />}
              onPress={() => openUrl(`mailto:${supportEmail}`)}
              isLast
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.colorTextMuted }]}>About</Text>
          <View style={[styles.card, cardStyle]}>
            <LinkRow
              label='Privacy policy'
              hint='How AlterSend handles your data'
              icon={<LockIcon size={16} color={theme.colors.colorTextSecondary} />}
              onPress={() => openUrl(privacyPolicyUrl)}
            />
            <LinkRow
              label='Terms of service'
              hint='Rules for using AlterSend'
              icon={<FileTextIcon size={16} color={theme.colors.colorTextSecondary} />}
              onPress={() => openUrl(termsOfServiceUrl)}
            />
            <LinkRow
              label='Website'
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
              Peer-to-peer file transfer
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
    gap: 2
  },
  rowLabel: {
    fontSize: 14,
    fontWeight: '500'
  },
  rowHint: {
    fontSize: 12
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
    fontWeight: '600'
  },
  brandTagline: {
    fontSize: 12
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
