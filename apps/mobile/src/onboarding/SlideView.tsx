import { memo } from 'react'
import { useTheme } from '@altersend/components'
import { useTranslation } from '@altersend/locales'
import { StyleSheet, View } from 'react-native'
import { Text } from '@/src/components/ThemedText'
import { BottomFade } from './BottomFade'
import { PhoneMockup } from './PhoneMockup'
import type { OnboardingStep } from './steps'

const PHONE_WIDTH_RATIO = 0.64
const MAX_PHONE_WIDTH = 260
const STEP_PHONE_WIDTH_RATIO = 0.68
const MAX_STEP_PHONE_WIDTH = 275
const FADE_HEIGHT = 120

interface SlideViewProps {
  step: OnboardingStep
  width: number
  active: boolean
}

export const SlideView = memo(function SlideView({ step, width, active }: SlideViewProps) {
  const { t } = useTranslation(['onboarding'])
  const { theme } = useTheme()
  const c = theme.colors
  const isWelcome = step.kind === 'welcome'
  const align = isWelcome ? styles.centered : null
  const phoneWidth = isWelcome
    ? Math.min(MAX_PHONE_WIDTH, width * PHONE_WIDTH_RATIO)
    : Math.min(MAX_STEP_PHONE_WIDTH, width * STEP_PHONE_WIDTH_RATIO)

  const copy = (
    <View style={isWelcome ? styles.welcomeCopy : styles.stepCopy}>
      <Text style={[styles.title, align, { color: c.colorTextPrimary }]}>
        {t(`onboarding:steps.${step.kind}.title`)}
      </Text>
      <Text style={[styles.description, align, { color: c.colorTextSecondary }]}>
        {t(`onboarding:steps.${step.kind}.description`)}
      </Text>
    </View>
  )

  const phone = (
    <View style={isWelcome ? styles.phoneArea : [styles.phoneArea, styles.stepPhoneArea]}>
      <PhoneMockup screen={step.screen} video={step.video} playing={active} width={phoneWidth} />
      <BottomFade color={c.colorBackground} height={FADE_HEIGHT} />
    </View>
  )

  return (
    <View style={[styles.slide, { width }]}>
      {isWelcome ? phone : copy}
      {isWelcome ? copy : phone}
    </View>
  )
})

const styles = StyleSheet.create({
  slide: {
    flex: 1,
    paddingHorizontal: 20
  },
  stepCopy: {
    paddingTop: 28,
    paddingBottom: 8
  },
  welcomeCopy: {
    paddingTop: 8,
    paddingBottom: 44,
    paddingHorizontal: 16
  },
  phoneArea: {
    flex: 1,
    alignItems: 'center',
    overflow: 'hidden',
    paddingTop: 8
  },
  stepPhoneArea: {
    paddingTop: 32
  },
  title: {
    fontSize: 30,
    fontWeight: '700',
    letterSpacing: -0.8,
    lineHeight: 35
  },
  description: {
    marginTop: 14,
    fontSize: 15,
    lineHeight: 21
  },
  centered: {
    textAlign: 'center'
  }
})
