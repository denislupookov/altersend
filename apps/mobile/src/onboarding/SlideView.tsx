import { memo } from 'react'
import { ExternalLink, useTheme } from '@altersend/components'
import type { OnboardingSlide } from '@altersend/domain'
import { useTranslation } from '@altersend/locales'
import { Linking, StyleSheet, View } from 'react-native'
import { OnboardingIllustration } from './OnboardingIllustration'
import { Text } from '@/src/components/ThemedText'

interface SlideViewProps {
  slide: OnboardingSlide
  width: number
  heroHeight: number
}

function openLink(url: string) {
  Linking.openURL(url).catch((err) => console.warn('onboarding: could not open url', err))
}

export const SlideView = memo(function SlideView({ slide, width, heroHeight }: SlideViewProps) {
  const { t } = useTranslation(['onboarding'])
  const { theme } = useTheme()
  const link = slide.link?.url

  return (
    <View style={[styles.slide, { width }]}>
      <OnboardingIllustration kind={slide.kind} height={heroHeight} />

      <Text style={[styles.title, { color: theme.colors.colorTextPrimary }]}>
        {t(`onboarding:slides.${slide.kind}.title`)}
      </Text>
      <Text style={[styles.subtitle, { color: theme.colors.colorTextPrimary }]}>
        {t(`onboarding:slides.${slide.kind}.description`)}
      </Text>

      {link ? (
        <View style={styles.linkWrap}>
          <ExternalLink href={link} onPress={() => openLink(link)}>
            {t('onboarding:slides.privacy.link')}
          </ExternalLink>
        </View>
      ) : null}
    </View>
  )
})

const styles = StyleSheet.create({
  slide: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingBottom: 40
  },
  title: {
    marginTop: 44,
    fontSize: 30,
    fontWeight: '700',
    letterSpacing: -1,
    textAlign: 'center',
    maxWidth: 372,
    lineHeight: 35
  },
  subtitle: {
    marginTop: 24,
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
    maxWidth: 360
  },
  linkWrap: {
    marginTop: 10
  }
})
