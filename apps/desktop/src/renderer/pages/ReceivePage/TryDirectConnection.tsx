import { Button, ExternalLink } from '@altersend/components'
import { InfoIcon } from '@altersend/components/icons'
import { reconnectSession } from '@altersend/domain'
import { useTranslation } from '@altersend/locales'
import { Popover } from '../../components/Popover'
import { openSettingsPanel } from '../../components/Settings/settingsControl'

interface TryDirectConnectionProps {
  canReconnect: boolean
}

export function TryDirectConnection({ canReconnect }: TryDirectConnectionProps) {
  const { t } = useTranslation(['receive', 'common'])

  return (
    <Popover
      side='top'
      align='left'
      trigger={
        <Button
          variant='ghost'
          size='xs'
          iconOnly
          aria-label={t('receive:relayLimit.directTitle')}
          icon={<InfoIcon size={16} />}
        />
      }
    >
      {(close) => (
        <div className='w-[300px] p-3'>
          <p className='m-0 text-[14px] font-semibold text-text-primary'>
            {t('receive:relayLimit.directTitle')}
          </p>
          <ol className='m-0 mt-2 list-decimal pl-5 text-[13px] leading-[1.6] text-text-secondary'>
            <li>{t('receive:relayLimit.directSameWifi')}</li>
            <li>{t('receive:relayLimit.directVpn')}</li>
          </ol>
          <p className='m-0 mt-2 text-[12.5px] leading-snug text-text-muted'>
            {t('receive:relayLimit.directFree')}
          </p>
          <p className='m-0 mt-2 text-[12.5px] leading-snug text-text-muted'>
            {t('receive:relayLimit.directOwnRelay')}{' '}
            <ExternalLink
              inline
              onPress={() => {
                close()
                openSettingsPanel('connection')
              }}
            >
              {t('receive:actions.openRelaySettings')}
            </ExternalLink>
          </p>
          {canReconnect ? (
            <div className='mt-3 flex justify-end gap-2'>
              <Button onClick={close} size='sm' variant='ghost'>
                {t('common:actions.cancel')}
              </Button>
              <Button
                onClick={() => {
                  close()
                  reconnectSession().catch((error: unknown) => {
                    console.error('TryDirectConnection: reconnect failed', error)
                  })
                }}
                size='sm'
                variant='primary'
              >
                {t('common:actions.tryAgain')}
              </Button>
            </div>
          ) : null}
        </div>
      )}
    </Popover>
  )
}
