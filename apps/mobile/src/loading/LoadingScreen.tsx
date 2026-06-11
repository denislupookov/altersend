import { useTheme } from '@altersend/components'
import { useTranslation } from '@altersend/locales'
import { Image, StyleSheet, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import LoadingSvg from '../../../../assets/loading.svg'
import brandLogo from '@/assets/images/brand-logo.png'
import { Text } from '@/src/components/ThemedText'

interface LoadingScreenProps {
  progress?: number
}

export function LoadingScreen({ progress = 0 }: LoadingScreenProps) {
  const { t } = useTranslation(['common'])
  const { theme } = useTheme()
  const insets = useSafeAreaInsets()
  const clamped = Math.max(0, Math.min(100, progress))

  return (
    <View
      style={[
        styles.screen,
        {
          backgroundColor: theme.colors.colorBackground,
          paddingTop: insets.top + 4,
          paddingBottom: Math.max(insets.bottom + 76, 76)
        }
      ]}
    >
      <View style={styles.header}>
        <Image source={brandLogo} style={styles.brandLogo} resizeMode='contain' />
        <Text style={[styles.brandWordmark, { color: theme.colors.colorTextPrimary }]}>
          AlterSend
        </Text>
      </View>

      <View style={styles.content}>
        <LoadingSvg height={160} width={237} />
        <Text style={[styles.title, { color: theme.colors.colorTextPrimary }]}>
          {t('common:app.welcome')}
        </Text>
        <Text style={[styles.subtitle, { color: theme.colors.colorTextSecondary }]}>
          {t('common:app.loadingTagline')}
        </Text>
      </View>

      <View style={styles.footer}>
        <View style={[styles.progressTrack, { backgroundColor: theme.colors.colorBorderPrimary }]}>
          <View
            style={[
              styles.progressFill,
              { backgroundColor: theme.colors.colorAccent, width: `${clamped}%` as `${number}%` }
            ]}
          />
        </View>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  screen: {
    flex: 1
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginTop: 28,
    gap: 10
  },
  brandLogo: {
    width: 32,
    height: 32
  },
  brandWordmark: {
    fontSize: 22,
    fontWeight: '700',
    letterSpacing: -0.3
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 28
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    letterSpacing: -1.2,
    textAlign: 'center',
    maxWidth: 320,
    lineHeight: 32,
    marginTop: 36
  },
  subtitle: {
    marginTop: 12,
    fontSize: 14,
    lineHeight: 22,
    textAlign: 'center',
    maxWidth: 320
  },
  footer: {
    paddingHorizontal: 28,
    alignItems: 'center'
  },
  progressTrack: {
    height: 10,
    width: '100%',
    maxWidth: 360,
    borderRadius: 999,
    overflow: 'hidden'
  },
  progressFill: {
    height: '100%',
    borderRadius: 999
  }
})
