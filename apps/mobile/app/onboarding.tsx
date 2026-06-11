import { useRef, useState } from 'react'
import { Button, ExternalLink, PaginationDots, useTheme } from '@altersend/components'
import { onboardingSlides, type OnboardingSlide, type OnboardingSlideKind } from '@altersend/domain'
import { useTranslation } from '@altersend/locales'
import { useRouter } from 'expo-router'
import {
  FlatList,
  Image,
  Linking,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  StyleSheet,
  View,
  useWindowDimensions
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { OnboardingIllustration } from '@/src/onboarding/OnboardingIllustration'
import { markOnboardingCompleted } from '@/src/onboarding/onboardingStorage'
import brandLogo from '@/assets/images/brand-logo.png'
import { Text } from '@/src/components/ThemedText'

function getSlideKey(kind: OnboardingSlideKind) {
  switch (kind) {
    case 'pairing':
      return 'direct'
    case 'keep-open':
      return 'keepOpen'
    case 'privacy':
      return 'encrypted'
  }
}

export default function OnboardingScreen() {
  const { t } = useTranslation(['onboarding', 'common'])
  const { theme } = useTheme()
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const { width } = useWindowDimensions()
  const [index, setIndex] = useState(0)
  const listRef = useRef<FlatList<OnboardingSlide>>(null)

  const isLast = index === onboardingSlides.length - 1

  const finish = () => {
    markOnboardingCompleted()
    router.replace('/send')
  }

  const next = () => {
    if (isLast) {
      finish()
      return
    }
    listRef.current?.scrollToIndex({ index: index + 1, animated: true })
  }

  const onMomentumEnd = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const nextIndex = Math.round(event.nativeEvent.contentOffset.x / width)
    if (nextIndex !== index) setIndex(nextIndex)
  }

  return (
    <View
      style={[
        styles.screen,
        {
          backgroundColor: theme.colors.colorBackground,
          paddingTop: insets.top + 4,
          paddingBottom: Math.max(insets.bottom, 12)
        }
      ]}
    >
      <View style={styles.header}>
        <View style={styles.brandRow}>
          <Image source={brandLogo} style={styles.brandLogo} resizeMode='contain' />
          <Text style={[styles.brandWordmark, { color: theme.colors.colorTextPrimary }]}>
            AlterSend
          </Text>
        </View>
        <View pointerEvents={isLast ? 'none' : 'auto'} style={{ opacity: isLast ? 0 : 1 }}>
          <Button onClick={finish} size='sm' variant='ghost'>
            {t('common:actions.skip')}
          </Button>
        </View>
      </View>

      <FlatList
        ref={listRef}
        data={onboardingSlides}
        keyExtractor={(item) => item.kind}
        renderItem={({ item }) => <Slide slide={item} width={width} />}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={onMomentumEnd}
        getItemLayout={(_, i) => ({ length: width, offset: width * i, index: i })}
        style={styles.pager}
      />

      <View style={styles.footer}>
        <PaginationDots count={onboardingSlides.length} activeIndex={index} />
        <Button onClick={next} size='lg' variant='light' width='full'>
          {isLast ? t('common:actions.getStarted') : t('common:actions.continue')}
        </Button>
      </View>
    </View>
  )
}

function Slide({ slide, width }: { slide: OnboardingSlide; width: number }) {
  const { t } = useTranslation(['onboarding'])
  const { theme } = useTheme()
  const slideKey = getSlideKey(slide.kind)

  return (
    <View style={[styles.slide, { width }]}>
      <View style={styles.heroWrap}>
        <SlideHero slide={slide} />
      </View>

      <Text style={[styles.title, { color: theme.colors.colorTextPrimary }]}>
        {t(`onboarding:slides.${slideKey}.title`)}
      </Text>
      <Text style={[styles.subtitle, { color: theme.colors.colorTextSecondary }]}>
        {t(`onboarding:slides.${slideKey}.description`)}
      </Text>

      {slide.link ? (
        <View style={styles.linkButton}>
          <ExternalLink href={slide.link.url} onPress={() => void Linking.openURL(slide.link!.url)}>
            {t('onboarding:slides.encrypted.link')}
          </ExternalLink>
        </View>
      ) : null}
    </View>
  )
}

function SlideHero({ slide }: { slide: OnboardingSlide }) {
  return (
    <View style={styles.illustrationWrap}>
      <OnboardingIllustration kind={slide.kind} />
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
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginTop: 28
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
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
  pager: {
    flex: 1
  },
  slide: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 28
  },
  heroWrap: {
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12
  },
  illustrationWrap: {
    alignItems: 'center',
    justifyContent: 'center'
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    letterSpacing: -1.2,
    textAlign: 'center',
    maxWidth: 320,
    lineHeight: 32
  },
  subtitle: {
    marginTop: 12,
    fontSize: 14,
    lineHeight: 22,
    textAlign: 'center',
    maxWidth: 320
  },
  linkButton: {
    position: 'absolute',
    bottom: 16,
    paddingVertical: 6,
    paddingHorizontal: 4
  },
  footer: {
    paddingHorizontal: 20,
    paddingBottom: 36,
    gap: 18
  }
})
