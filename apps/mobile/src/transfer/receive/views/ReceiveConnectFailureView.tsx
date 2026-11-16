import { useEffect } from 'react'
import { useRouter } from 'expo-router'
import { Button } from '@altersend/components'
import {
  CONNECT_FAILURE_FIX_LABEL,
  clearSession,
  getConnectFailureFix,
  getConnectFailureStatus,
  retryJoin,
  useSubscriptionStore,
  useTransferStore,
  type ConnectFailureCode
} from '@altersend/domain'
import { useTranslation } from '@altersend/locales'
import { errorTap } from '@/src/haptics'
import ConnectionLostSvg from '../../../../../../assets/connection-lost.svg'
import { ReceiveStatusView } from './ReceiveStatusView'

interface ReceiveConnectFailureViewProps {
  code: ConnectFailureCode
}

const FIX_ROUTE = { relaySettings: '/connection', upgrade: '/account' } as const

export function ReceiveConnectFailureView({ code }: ReceiveConnectFailureViewProps) {
  const { t } = useTranslation(['receive', 'common', 'settings'])
  const router = useRouter()
  const isPro = useSubscriptionStore((s) => s.active)
  const retryTopic = useTransferStore((s) => s.retryTopic)
  const status = getConnectFailureStatus(t, code)
  const fix = getConnectFailureFix(code, isPro)

  useEffect(() => {
    errorTap()
  }, [])

  const footer = (
    <>
      {retryTopic ? (
        <Button onClick={retryJoin} size='lg' variant='primary' width='full'>
          {t('common:actions.tryAgain')}
        </Button>
      ) : null}
      {fix ? (
        <Button
          onClick={() => router.push(FIX_ROUTE[fix])}
          size='lg'
          variant='secondary'
          width='full'
        >
          {t(CONNECT_FAILURE_FIX_LABEL[fix])}
        </Button>
      ) : null}
      <Button onClick={clearSession} size='lg' variant='ghost' width='full'>
        {t('receive:actions.useAnotherCode')}
      </Button>
    </>
  )

  return (
    <ReceiveStatusView
      status={status}
      illustration={<ConnectionLostSvg width='100%' height='100%' />}
      aspectRatio={800 / 430.493}
      illustrationWidth='65%'
      footer={footer}
    />
  )
}
