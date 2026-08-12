import { useState } from 'react'
import { Button, ExternalLink, SegmentedProgress, ThemeType, useTheme } from '@altersend/components'
import { onboardingSlides, type OnboardingSlideKind } from '@altersend/domain'
import { useTranslation } from '@altersend/locales'
import logoOnLight from '../../../../../../assets/altersend-logo-dark.png'
import logoOnDark from '../../../../../../assets/altersend-logo.png'
import privateSharingSvg from '../../../../../../assets/private-sharing.svg'
import syncDevicesSvg from '../../../../../../assets/sync_devices.svg'
import shareLinkSvg from '../../../../../../assets/share-link.svg'

const ILLUSTRATIONS: Record<OnboardingSlideKind, string> = {
  privacy: privateSharingSvg,
  pair: syncDevicesSvg,
  link: shareLinkSvg
}

interface OnboardingPageProps {
  onFinish: () => void
}

export default function OnboardingPage({ onFinish }: OnboardingPageProps) {
  const { t } = useTranslation(['onboarding', 'common'])
  const { themeType } = useTheme()
  const [index, setIndex] = useState(0)

  const slide = onboardingSlides[index]
  const isLast = index === onboardingSlides.length - 1
  const brandLogo = themeType === ThemeType.Light ? logoOnLight : logoOnDark

  const next = () => {
    if (isLast) {
      onFinish()
      return
    }
    setIndex((i) => i + 1)
  }

  return (
    <main className='flex h-screen w-full flex-col overflow-hidden bg-background text-text-primary'>
      <div className='h-10 w-full shrink-0' style={{ WebkitAppRegion: 'drag' }} />

      <div className='flex shrink-0 justify-center px-8'>
        <img src={brandLogo} alt='AlterSend' className='h-8 w-auto object-contain' />
      </div>

      <div className='flex min-h-0 flex-1 flex-col items-center justify-center px-8 pb-10'>
        <img src={ILLUSTRATIONS[slide.kind]} alt='' className='block h-auto max-h-[190px] w-auto' />

        <h1 className='mb-0 mt-11 max-w-[460px] text-center text-[30px] font-bold leading-[1.15] tracking-[-0.03em] text-text-primary'>
          {t(`onboarding:slides.${slide.kind}.title`)}
        </h1>

        <p className='mt-6 max-w-[440px] text-center text-[15px] leading-[1.5] text-text-primary'>
          {t(`onboarding:slides.${slide.kind}.description`)}
        </p>

        {slide.link ? (
          <div className='mt-2.5'>
            <ExternalLink href={slide.link.url}>{t('onboarding:slides.privacy.link')}</ExternalLink>
          </div>
        ) : null}
      </div>

      <div className='flex shrink-0 flex-col items-center gap-5 px-8 pb-16'>
        <div className='w-[180px]'>
          <SegmentedProgress count={onboardingSlides.length} activeIndex={index} />
        </div>

        <Button onClick={next} size='md' variant='light'>
          {isLast ? t('common:actions.getStarted') : t('common:actions.continue')}
        </Button>
      </div>
    </main>
  )
}
