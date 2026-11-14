import { WaitingState } from '@altersend/components'
import { GlobeIcon } from '@altersend/components/icons'
import { useTranslation } from '@altersend/locales'
import type { AccountPhaseProps } from './types'

export function CheckoutWaitingStatus({ model, errorText }: AccountPhaseProps) {
  const { t } = useTranslation(['settings'])
  const viaStore = Boolean(model.store)

  return (
    <div className='flex h-full min-h-0 flex-col items-center justify-center'>
      <WaitingState
        icon={<GlobeIcon size={30} />}
        title={t(viaStore ? 'settings:account.waitingTitleStore' : 'settings:account.waitingTitle')}
        description={t(
          viaStore ? 'settings:account.waitingBodyStore' : 'settings:account.waitingBody'
        )}
      />
      {errorText ? (
        <p className='m-0 mt-4 text-center text-[12px] text-text-danger'>{errorText}</p>
      ) : null}
    </div>
  )
}
