import { Button } from '@altersend/components'
import {
  CONNECT_FAILURE_FIX_LABEL,
  clearSession,
  getConnectFailureFix,
  retryJoin,
  useSubscriptionStore,
  useTransferStore,
  type ConnectFailureCode
} from '@altersend/domain'
import { useTranslation } from '@altersend/locales'
import { TransferActionGroup } from '../../components'
import { openSettingsPanel } from '../../components/Settings'

interface ConnectFailureActionsProps {
  code: ConnectFailureCode
}

const FIX_SECTION = { relaySettings: 'connection', upgrade: 'account' } as const

export function ConnectFailureActions({ code }: ConnectFailureActionsProps) {
  const { t } = useTranslation(['receive', 'common', 'settings'])
  const isPro = useSubscriptionStore((s) => s.active)
  const retryTopic = useTransferStore((s) => s.retryTopic)
  const fix = getConnectFailureFix(code, isPro)

  return (
    <TransferActionGroup>
      <Button onClick={clearSession} size='sm' variant={fix ? 'ghost' : 'secondary'}>
        {t('receive:actions.useAnotherCode')}
      </Button>
      {fix ? (
        <Button onClick={() => openSettingsPanel(FIX_SECTION[fix])} size='sm' variant='secondary'>
          {t(CONNECT_FAILURE_FIX_LABEL[fix])}
        </Button>
      ) : null}
      {retryTopic ? (
        <Button onClick={retryJoin} size='sm' variant='primary'>
          {t('common:actions.tryAgain')}
        </Button>
      ) : null}
    </TransferActionGroup>
  )
}
