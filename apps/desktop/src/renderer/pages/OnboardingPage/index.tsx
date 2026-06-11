import { useState } from 'react'
import { Button, PaginationDots } from '@altersend/components'
import { onboardingSlides, type OnboardingSlide, type OnboardingSlideKind } from '@altersend/domain'
import { ExternalLink } from '@altersend/components'
import { useTranslation } from '@altersend/locales'
import logo from '../../../../../../assets/logo.png'
import pairingSvg from '../../../../../../assets/onboarding.svg'
import keepOpenSvg from '../../../../../../assets/laptop.svg'
import encryptedSvg from '../../../../../../assets/encrypted.svg'

const ILLUSTRATIONS: Record<OnboardingSlideKind, string> = {
  pairing: pairingSvg,
  'keep-open': keepOpenSvg,
  privacy: encryptedSvg
}

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

interface OnboardingPageProps {
  onFinish: () => void
}

export default function OnboardingPage({ onFinish }: OnboardingPageProps) {
  const { t } = useTranslation(['onboarding', 'common'])
  const [index, setIndex] = useState(0)
  const slide = onboardingSlides[index]
  const isLast = index === onboardingSlides.length - 1
  const slideKey = getSlideKey(slide.kind)

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

      <div className='mt-3 flex shrink-0 items-center justify-between px-6'>
        <div className='flex items-center gap-2.5'>
          <img src={logo} alt='AlterSend' className='h-7 w-7 object-contain' />
          <span className='text-[20px] font-bold tracking-[-0.02em] text-text-primary'>
            AlterSend
          </span>
        </div>
        <div className={isLast ? 'pointer-events-none invisible' : ''}>
          <Button onClick={onFinish} size='sm' variant='ghost'>
            {t('common:actions.skip')}
          </Button>
        </div>
      </div>

      <div className='relative flex min-h-0 flex-1 flex-col items-center justify-center px-8 py-6'>
        <SlideHero slide={slide} />

        <h1 className='mb-0 mt-9 max-w-[460px] text-center text-[30px] font-bold leading-[1.1] tracking-[-0.03em] text-text-primary'>
          {t(`onboarding:slides.${slideKey}.title`)}
        </h1>

        <p className='mt-3 max-w-[420px] text-center text-[13px] leading-[1.6] text-text-secondary'>
          {t(`onboarding:slides.${slideKey}.description`)}
        </p>

        {slide.link ? (
          <div className='absolute bottom-4'>
            <ExternalLink href={slide.link.url}>
              {t('onboarding:slides.encrypted.link')}
            </ExternalLink>
          </div>
        ) : null}
      </div>

      <div className='flex shrink-0 flex-col items-center gap-5 px-8 pb-16'>
        <PaginationDots count={onboardingSlides.length} activeIndex={index} />

        <Button onClick={next} size='sm' variant='primary'>
          {isLast ? t('common:actions.getStarted') : t('common:actions.continue')}
        </Button>
      </div>
    </main>
  )
}

function SlideHero({ slide }: { slide: OnboardingSlide }) {
  return (
    <img src={ILLUSTRATIONS[slide.kind]} alt='' className='block h-auto max-h-[200px] w-auto' />
  )
}
