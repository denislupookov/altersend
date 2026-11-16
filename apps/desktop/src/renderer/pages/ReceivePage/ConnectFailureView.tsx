import { StatusState } from '@altersend/components'
import { getConnectFailureStatus, type ConnectFailureCode } from '@altersend/domain'
import { useTranslation } from '@altersend/locales'

interface ConnectFailureViewProps {
  code: ConnectFailureCode
}

export function ConnectFailureView({ code }: ConnectFailureViewProps) {
  const { t } = useTranslation(['receive'])
  const status = getConnectFailureStatus(t, code)

  return (
    <div className='flex h-full items-center justify-center'>
      <StatusState {...status} />
    </div>
  )
}
