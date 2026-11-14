import { Button } from '@altersend/components'
import { useTranslation } from '@altersend/locales'
import { SectionShell } from '../SectionShell'
import { CheckoutWaitingStatus } from './CheckoutWaitingStatus'
import type { AccountPhaseProps } from './types'

export function CheckoutWaiting({ model, errorText }: AccountPhaseProps) {
  const { t } = useTranslation(['settings'])

  const footer = (
    <div className='flex items-center justify-end gap-2'>
      <Button size='sm' variant='ghost' disabled={model.busy} onClick={model.cancelUpgrade}>
        {t('settings:account.cancel')}
      </Button>
      <Button size='sm' variant='secondary' disabled={model.busy} onClick={model.retryUpgrade}>
        {t('settings:account.checkAgain')}
      </Button>
    </div>
  )

  return (
    <SectionShell footer={footer}>
      <CheckoutWaitingStatus model={model} errorText={errorText} />
    </SectionShell>
  )
}
