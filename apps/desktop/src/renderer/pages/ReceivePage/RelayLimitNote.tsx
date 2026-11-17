import { Button } from '@altersend/components'
import { NATIVE_RELAY_MAX_LABEL } from '@altersend/domain'
import { useTranslation } from '@altersend/locales'
import { TryDirectConnection } from './TryDirectConnection'

interface RelayLimitNoteProps {
  onGetPro: () => void
}

export function RelayLimitNote({ onGetPro }: RelayLimitNoteProps) {
  const { t } = useTranslation(['receive', 'settings'])

  return (
    <div className='flex min-h-11 items-center gap-1.5 border-t border-border-primary pl-2 pr-2'>
      <TryDirectConnection />
      <p className='m-0 min-w-0 flex-1 truncate text-[13px] text-text-muted'>
        {t('receive:relayLimit.free', { limit: NATIVE_RELAY_MAX_LABEL })}
      </p>
      <Button onClick={onGetPro} size='xs' variant='ghost'>
        {t('settings:account.getPro')}
      </Button>
    </div>
  )
}
