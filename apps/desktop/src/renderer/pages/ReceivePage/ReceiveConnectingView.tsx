import { ExternalLink, StatusState } from '@altersend/components'
import { useConnectingStatus } from '@altersend/domain'
import { Trans, useTranslation } from '@altersend/locales'
import { openSettingsPanel } from '../../components/Settings'

export function ReceiveConnectingView() {
  const { t } = useTranslation(['receive'])
  const { status, showProOffer } = useConnectingStatus(t)

  return (
    <div className='flex h-full items-center justify-center'>
      <StatusState {...status}>
        {showProOffer ? (
          <p className='m-0 mt-1 max-w-[340px] text-center text-[13px] leading-[1.5] text-text-muted'>
            <Trans
              ns='receive'
              i18nKey='page.relayBusy.proOffer'
              components={{
                pro: <ExternalLink inline onPress={() => openSettingsPanel('account')} />
              }}
            />
          </p>
        ) : null}
      </StatusState>
    </div>
  )
}
