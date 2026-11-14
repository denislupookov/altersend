import type { ReactElement } from 'react'
import { Pressable, StyleSheet, View } from 'react-native'
import { Button, useTheme } from '@altersend/components'
import {
  CodeIcon,
  DiscordIcon,
  GithubIcon,
  GlobeIcon,
  HeartIcon,
  XIcon
} from '@altersend/components/icons'
import { communityLinks, type CommunityLinkKey } from '@altersend/domain'
import { useTranslation } from '@altersend/locales'
import { Layout } from '@/src/components'
import { Text } from '@/src/components/ThemedText'
import { DismissRow } from './DismissRow'
import { openExternalUrl } from './openExternalUrl'

const BADGE_SIZE = 72
const BADGE_OVERLAP = 18

interface ProIntroProps {
  onContinue: () => void
  onDismiss: () => void
  pageIndicator?: ReactElement
}

export function ProIntro({ onContinue, onDismiss, pageIndicator }: ProIntroProps) {
  const { t } = useTranslation(['onboarding', 'settings', 'common'])
  const { theme } = useTheme()
  const c = theme.colors

  const icons: Record<CommunityLinkKey, ReactElement> = {
    discord: <DiscordIcon size={30} color={c.colorTextPrimary} />,
    github: <GithubIcon size={36} color={c.colorOnAccent} />,
    x: <XIcon size={28} color={c.colorTextPrimary} />
  }

  const rows = [
    {
      key: 'open',
      icon: <CodeIcon size={20} color={c.colorTextPrimary} />,
      title: t('onboarding:proIntro.openTitle'),
      body: t('onboarding:proIntro.openBody')
    },
    {
      key: 'relay',
      icon: <GlobeIcon size={20} color={c.colorTextPrimary} />,
      title: t('onboarding:proIntro.relayTitle'),
      body: t('onboarding:proIntro.relayBody')
    },
    {
      key: 'support',
      icon: <HeartIcon size={20} color={c.colorTextPrimary} />,
      title: t('onboarding:proIntro.supportTitle'),
      body: t('onboarding:proIntro.supportBody')
    }
  ]

  const footer = (
    <View style={styles.footer}>
      {pageIndicator}
      <Button size='lg' width='full' onClick={onContinue}>
        {t('common:actions.continue')}
      </Button>
    </View>
  )

  return (
    <Layout compactTop footer={footer}>
      <DismissRow onDismiss={onDismiss} />

      <View style={styles.badges}>
        {communityLinks.map((link, index) => (
          <Pressable
            key={link.key}
            accessibilityRole='link'
            accessibilityLabel={t(link.labelKey)}
            onPress={() => openExternalUrl(link.url)}
            style={[
              styles.badge,
              {
                backgroundColor: link.key === 'github' ? c.colorAccent : c.colorBackgroundSubtle,
                marginLeft: index === 0 ? 0 : -BADGE_OVERLAP,
                zIndex: link.key === 'github' ? 2 : 1
              }
            ]}
          >
            {icons[link.key]}
          </Pressable>
        ))}
      </View>

      <Text style={[styles.title, { color: c.colorTextPrimary }]}>
        {t('onboarding:proIntro.title')}
      </Text>

      <View style={styles.rows}>
        {rows.map((row) => (
          <View key={row.key} style={styles.row}>
            <View style={[styles.tile, { backgroundColor: c.colorSurfacePrimary }]}>
              {row.icon}
            </View>
            <View style={styles.rowText}>
              <Text style={[styles.rowTitle, { color: c.colorTextPrimary }]}>{row.title}</Text>
              <Text style={[styles.rowBody, { color: c.colorTextSecondary }]}>{row.body}</Text>
            </View>
          </View>
        ))}
      </View>
    </Layout>
  )
}

const styles = StyleSheet.create({
  badges: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 56 },
  badge: {
    width: BADGE_SIZE,
    height: BADGE_SIZE,
    borderRadius: BADGE_SIZE / 2,
    alignItems: 'center',
    justifyContent: 'center'
  },
  title: {
    marginTop: 22,
    fontSize: 30,
    fontWeight: '700',
    letterSpacing: -0.8,
    lineHeight: 35,
    textAlign: 'center'
  },
  rows: { marginTop: 40 },
  row: { flexDirection: 'row', alignItems: 'flex-start', gap: 16, paddingVertical: 20 },
  tile: {
    width: 44,
    height: 44,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center'
  },
  rowText: { flex: 1, gap: 3 },
  rowTitle: { fontSize: 17, fontWeight: '600', lineHeight: 22 },
  rowBody: { fontSize: 15, lineHeight: 21 },
  footer: { gap: 16, paddingTop: 12 }
})
