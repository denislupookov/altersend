import { useCallback, useRef, useState } from 'react'
import { Button, SegmentedProgress, ThemeType, useTheme } from '@altersend/components'
import { onboardingSlides, type OnboardingSlide } from '@altersend/domain'
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
import { SlideView } from '@/src/onboarding/SlideView'
import { markOnboardingCompleted } from '@/src/onboarding/onboardingStorage'
import { requestNotificationPermission } from '@/src/lifecycle/notificationPermission'
import logoOnLight from '../../../assets/altersend-logo-dark.png'
import logoOnDark from '../../../assets/altersend-logo.png'

const MAX_HERO_HEIGHT = 190
const HERO_HEIGHT_RATIO = 0.24

export default function OnboardingScreen() {
  const { t } = useTranslation(['common'])
  const { theme, themeType } = useTheme()
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const { width, height } = useWindowDimensions()
  const [progress, setProgress] = useState(0)
  const listRef = useRef<FlatList<OnboardingSlide>>(null)

  const index = Math.round(progress)
  const isLast = index === onboardingSlides.length - 1
  const brandLogo = themeType === ThemeType.Light ? logoOnLight : logoOnDark
  const heroHeight = Math.min(MAX_HERO_HEIGHT, height * HERO_HEIGHT_RATIO)

  const finish = () => {
    markOnboardingCompleted()
    requestNotificationPermission().catch((err: unknown) => {
      console.warn('onboarding: notification permission request failed', err)
    })
    router.replace('/send')
  }

  const next = () => {
    if (isLast) {
      finish()
      return
    }
    listRef.current?.scrollToIndex({ index: index + 1, animated: true })
  }

  const onScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    setProgress(event.nativeEvent.contentOffset.x / width)
  }

  const renderItem = useCallback(
    ({ item }: { item: OnboardingSlide }) => (
      <SlideView slide={item} width={width} heroHeight={heroHeight} />
    ),
    [width, heroHeight]
  )

  return (
    <View
      style={[
        styles.screen,
        {
          backgroundColor: theme.colors.colorBackground,
          paddingTop: insets.top + 30,
          paddingBottom: Math.max(insets.bottom, 12)
        }
      ]}
    >
      <View style={styles.header}>
        <Image source={brandLogo} style={styles.brandLogo} resizeMode='contain' />
      </View>

      <FlatList
        ref={listRef}
        data={onboardingSlides}
        keyExtractor={(item) => item.kind}
        renderItem={renderItem}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={onScroll}
        scrollEventThrottle={16}
        getItemLayout={(_, i) => ({ length: width, offset: width * i, index: i })}
        style={styles.pager}
      />

      <View style={styles.footer}>
        <View style={styles.progress}>
          <SegmentedProgress
            count={onboardingSlides.length}
            activeIndex={index}
            progress={progress}
          />
        </View>
        <Button onClick={next} size='lg' variant='light' width='full'>
          {isLast ? t('common:actions.getStarted') : t('common:actions.continue')}
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
    alignItems: 'center',
    paddingHorizontal: 20
  },
  brandLogo: {
    width: 148,
    height: 36
  },
  pager: {
    flex: 1
  },
  progress: {
    alignSelf: 'center',
    width: '32%'
  },
  footer: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 20,
    gap: 20
  }
})
