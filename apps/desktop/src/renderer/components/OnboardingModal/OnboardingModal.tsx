import { useState } from 'react'
import { Button, Modal } from '@altersend/components'
import { CloseIcon } from '@altersend/components/icons'
import { useSubscriptionStore } from '@altersend/domain'
import { useTranslation } from '@altersend/locales'
import { OnboardingFooter } from './OnboardingFooter'
import { PaywallPage } from './PaywallPage'
import { ProIntroView } from './ProIntroView'
import { StepView } from './StepView'
import { onboardingSteps } from './steps'

const INTRO_INDEX = onboardingSteps.length
const PAYWALL_INDEX = INTRO_INDEX + 1
const PAGE_COUNT = PAYWALL_INDEX + 1

interface OnboardingModalProps {
  open: boolean
  onFinish: () => void
}

export function OnboardingModal({ open, onFinish }: OnboardingModalProps) {
  const { t } = useTranslation(['onboarding', 'common'])
  const [index, setIndex] = useState(0)
  const isPro = useSubscriptionStore((state) => state.active)

  const isWelcome = index === 0
  const label = isWelcome ? t('common:actions.getStarted') : t('common:actions.continue')

  const back = () => setIndex((i) => i - 1)

  const next = () => {
    if (index === INTRO_INDEX && isPro) {
      onFinish()
      return
    }
    setIndex((i) => i + 1)
  }

  const renderPage = () => {
    if (index === PAYWALL_INDEX) {
      return <PaywallPage index={index} pageCount={PAGE_COUNT} onBack={back} onFinish={onFinish} />
    }

    return (
      <>
        <div className='flex min-h-0 flex-1 flex-col px-8 pt-12'>
          {index === INTRO_INDEX ? <ProIntroView /> : <StepView step={onboardingSteps[index]} />}
        </div>

        <OnboardingFooter
          index={index}
          pageCount={PAGE_COUNT}
          primary={{ label, onClick: next }}
          secondary={isWelcome ? undefined : { label: t('common:actions.back'), onClick: back }}
        />
      </>
    )
  }

  return (
    <Modal open={open} size='lg' closeLabel={t('common:actions.close')} onClose={onFinish}>
      <div className='relative flex h-[640px] max-h-[calc(100vh-48px)] flex-col'>
        <div className='absolute right-2 top-2 z-10'>
          <Button
            iconOnly
            pill
            size='sm'
            variant='ghost'
            icon={<CloseIcon size={16} />}
            aria-label={t('common:actions.close')}
            onClick={onFinish}
          />
        </div>

        {renderPage()}
      </div>
    </Modal>
  )
}
