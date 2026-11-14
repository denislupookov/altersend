import { useCallback, useRef, useState } from 'react'
import { Button, SegmentedProgress, ThemeType, useTheme } from '@altersend/components'
import { useSubscriptionStore } from '@altersend/domain'
import { useTranslation } from '@altersend/locales'
import { useRouter } from 'expo-router'
import {
  FlatList,
  Image,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  StyleSheet,
  View,
  useWindowDimensions
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { IconButton } from '@/src/components/IconButton'
import { SlideView } from '@/src/onboarding/SlideView'
import { onboardingSteps, type OnboardingStep } from '@/src/onboarding/steps'
import { ONBOARDING_ENTRY_PARAMS } from '@/src/account/onboardingEntry'
import { markOnboardingCompleted } from '@/src/onboarding/onboardingStorage'
import { requestNotificationPermission } from '@/src/lifecycle/notificationPermission'
import logoOnLight from '../../../assets/altersend-logo-dark.png'
import logoOnDark from '../../../assets/altersend-logo.png'

const STEP_COUNT = onboardingSteps.length - 1

export default function OnboardingScreen() {
  const { t } = useTranslation(['common'])
  const { theme, themeType } = useTheme()
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const { width } = useWindowDimensions()
  const [progress, setProgress] = useState(0)
  const listRef = useRef<FlatList<OnboardingStep>>(null)
  const isPro = useSubscriptionStore((state) => state.active)

  const index = Math.round(progress)
  const isWelcome = index === 0
  const isLast = index === onboardingSteps.length - 1
  const brandLogo = themeType === ThemeType.Light ? logoOnLight : logoOnDark

  const finish = () => {
    markOnboardingCompleted()
    requestNotificationPermission().catch((err: unknown) => {
      console.warn('onboarding: notification permission request failed', err)
    })
    router.replace('/send')
    if (!isPro) router.push({ pathname: '/account', params: ONBOARDING_ENTRY_PARAMS })
  }

  const goTo = (target: number) => {
    listRef.current?.scrollToIndex({ index: target, animated: true })
  }

  const next = () => {
    if (isLast) {
      finish()
      return
    }
    goTo(index + 1)
  }

  const onScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    setProgress(event.nativeEvent.contentOffset.x / width)
  }

  const renderItem = useCallback(
    ({ item }: { item: OnboardingStep }) => (
      <SlideView step={item} width={width} active={item === onboardingSteps[index]} />
    ),
    [width, index]
  )

  return (
    <View
      style={[
        styles.screen,
        {
          backgroundColor: theme.colors.colorBackground,
          paddingTop: insets.top + 8,
          paddingBottom: Math.max(insets.bottom, 12)
        }
      ]}
    >
      <View style={styles.header}>
        {isWelcome ? (
          <Image source={brandLogo} style={styles.brandLogo} resizeMode='contain' />
        ) : (
          <>
            <IconButton
              icon='back'
              label={t('common:actions.back')}
              onPress={() => goTo(index - 1)}
            />
            <View style={styles.progress}>
              <SegmentedProgress
                count={STEP_COUNT}
                activeIndex={index - 1}
                progress={Math.max(0, progress - 1)}
              />
            </View>
          </>
        )}
      </View>

      <FlatList
        ref={listRef}
        data={onboardingSteps}
        keyExtractor={(item) => item.kind}
        renderItem={renderItem}
        extraData={index}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={onScroll}
        scrollEventThrottle={16}
        getItemLayout={(_, i) => ({ length: width, offset: width * i, index: i })}
        style={styles.pager}
      />

      <View style={styles.footer}>
        <Button onClick={next} size='lg' variant='light' width='full'>
          {isWelcome ? t('common:actions.getStarted') : t('common:actions.continue')}
        </Button>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  screen: {
    flex: 1
  },
  header: {
    height: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20
  },
  brandLogo: {
    flex: 1,
    height: 32
  },
  progress: {
    width: '32%'
  },
  pager: {
    flex: 1
  },
  footer: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 20
  }
})
