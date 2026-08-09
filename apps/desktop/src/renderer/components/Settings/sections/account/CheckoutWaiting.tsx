import { Button, WaitingState } from '@altersend/components'
import { GlobeIcon } from '@altersend/components/icons'
import { useTranslation } from '@altersend/locales'
import { SectionShell } from '../SectionShell'
import type { AccountPhaseProps } from './types'

export function CheckoutWaiting({ model, errorText }: AccountPhaseProps) {
  const { t } = useTranslation(['settings'])
  const viaStore = Boolean(model.store)

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
      <div className='flex h-full min-h-0 flex-col items-center justify-center'>
        <WaitingState
          icon={<GlobeIcon size={30} />}
          title={t(
            viaStore ? 'settings:account.waitingTitleStore' : 'settings:account.waitingTitle'
          )}
          description={t(
            viaStore ? 'settings:account.waitingBodyStore' : 'settings:account.waitingBody'
          )}
        />
        {errorText ? (
          <p className='m-0 mt-4 text-center text-[12px] text-text-danger'>{errorText}</p>
        ) : null}
      </div>
    </SectionShell>
  )
}
