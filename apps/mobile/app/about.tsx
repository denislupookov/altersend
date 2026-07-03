import { Image, Linking, StyleSheet, View } from 'react-native'
import Constants from 'expo-constants'
import { LinkCard, LinkRow, useTheme } from '@altersend/components'
import {
  ArrowUpRightIcon,
  DiscordIcon,
  FileTextIcon,
  GlobeIcon,
  LockIcon,
  MailIcon
} from '@altersend/components/icons'
import {
  discordUrl,
  privacyPolicyUrl,
  supportEmail,
  termsOfServiceUrl,
  websiteUrl
} from '@altersend/domain'
import { useTranslation } from '@altersend/locales'
import { Layout } from '@/src/components'
import { Text } from '@/src/components/ThemedText'
import brandLogo from '@/assets/images/brand-logo.png'

export default function AboutScreen() {
  const { t } = useTranslation(['settings', 'common'])
  const { theme } = useTheme()
  const c = theme.colors
  const version = Constants.expoConfig?.version ?? '0.0.0'

  const openUrl = (url: string) => {
    void Linking.openURL(url).catch(() => {})
  }

  const resources = [
    { key: 'website', label: t('settings:rows.website'), Icon: GlobeIcon, url: websiteUrl },
    {
      key: 'privacy',
      label: t('settings:rows.privacyPolicy'),
      Icon: LockIcon,
      url: privacyPolicyUrl
    },
    { key: 'terms', label: t('settings:rows.terms'), Icon: FileTextIcon, url: termsOfServiceUrl },
    { key: 'discord', label: t('settings:rows.discord'), Icon: DiscordIcon, url: discordUrl },
    {
      key: 'contact',
      label: t('settings:rows.contact'),
      Icon: MailIcon,
      url: `mailto:${supportEmail}`
    }
  ]

  return (
    <Layout title={t('settings:sections.about')} description='' hasNativeHeader>
      <View style={styles.content}>
        <View style={styles.brand}>
          <Image source={brandLogo} style={styles.brandLogo} resizeMode='contain' />
          <Text style={[styles.brandName, { color: c.colorTextPrimary }]}>AlterSend</Text>
          <Text style={[styles.brandTagline, { color: c.colorTextMuted }]}>
            {t('common:app.tagline')}
          </Text>
        </View>

        <View
          style={[
            styles.card,
            { backgroundColor: c.colorBackgroundSubtle, borderColor: c.colorBorderPrimary }
          ]}
        >
          <View style={styles.infoRow}>
            <Text style={[styles.infoLabel, { color: c.colorTextPrimary }]}>
              {t('common:labels.version')}
            </Text>
            <Text style={[styles.infoValue, { color: c.colorTextMuted }]}>v{version}</Text>
          </View>
        </View>

        <LinkCard>
          {resources.map(({ key, label, Icon, url }, index) => (
            <LinkRow
              key={key}
              label={label}
              icon={<Icon size={16} color={c.colorTextSecondary} />}
              trailing={<ArrowUpRightIcon size={15} color={c.colorTextMuted} />}
              onPress={() => openUrl(url)}
              isLast={index === resources.length - 1}
            />
          ))}
        </LinkCard>

        <Text style={[styles.footer, { color: c.colorTextFaint }]}>
          © {new Date().getFullYear()} AlterSend
        </Text>
      </View>
    </Layout>
  )
}

const styles = StyleSheet.create({
  content: {
    gap: 20
  },
  brand: {
    alignItems: 'center',
    gap: 8,
    paddingTop: 8,
    paddingBottom: 4
  },
  brandLogo: {
    width: 60,
    height: 60,
    marginBottom: 4
  },
  brandName: {
    fontSize: 20,
    lineHeight: 26,
    fontWeight: '700'
  },
  brandTagline: {
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
    maxWidth: 300
  },
  card: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
    paddingHorizontal: 16
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    gap: 12
  },
  infoLabel: {
    fontSize: 15,
    fontWeight: '500'
  },
  infoValue: {
    fontSize: 15
  },
  footer: {
    fontSize: 12,
    textAlign: 'center',
    paddingTop: 4
  }
})
