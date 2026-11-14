import { Button } from '@altersend/components'
import { useTranslation } from '@altersend/locales'
import { HeroBackdrop } from '../../../HeroBackdrop'
import { SectionShell } from '../SectionShell'
import { PaywallComparison } from './PaywallComparison'
import type { AccountPhaseProps } from './types'

export function Paywall({ model, errorText }: AccountPhaseProps) {
  const { t } = useTranslation(['settings', 'common'])

  const footer = (
    <div className='flex items-center justify-between gap-3'>
      <Button size='sm' variant='ghost' disabled={model.busy} onClick={model.showEntry}>
        {t('settings:account.haveCodeLink')}
      </Button>
      <Button size='sm' variant='primary' loading={model.busy} onClick={model.startUpgrade}>
        {t('settings:account.getPro')}
      </Button>
    </div>
  )

  return (
    <SectionShell backdrop={<HeroBackdrop />} footer={footer}>
      <h2 className='m-0 mt-6 text-[30px] font-bold leading-tight tracking-[-0.6px] text-text-primary'>
        {t('settings:account.paywallTitle')}
      </h2>
      <p className='m-0 mt-1.5 text-[15px] leading-[21px] text-text-secondary'>
        {t('settings:account.paywallLead')}
      </p>

      <PaywallComparison model={model} errorText={errorText} />
    </SectionShell>
  )
}
