import { Button, Spinner } from '@altersend/components'
import { InfoIcon } from '@altersend/components/icons'
import { useTranslation } from '@altersend/locales'
import { TransferActionGroup, TransferCardFrame } from '../../components'
import { openSettingsPanel } from '../../components/Settings'
import { ConnectFailureActions } from './ConnectFailureActions'
import { ConnectFailureView } from './ConnectFailureView'
import { ReceiveCompleteView } from './ReceiveCompleteView'
import { ReceiveConnectedView } from './ReceiveConnectedView'
import { ReceiveConnectingView } from './ReceiveConnectingView'
import { ReceiveFileList } from './ReceiveFileList'
import { ReceiveJoinView } from './ReceiveJoinView'

import {
  clearSession,
  connectedStatusLabel,
  getConnectFailureCode,
  getReceivePageCopy,
  isSessionOverStep,
  useReceiveDownloads,
  useReceiveStep,
  useSubscriptionStore,
  useTransferStore
} from '@altersend/domain'

export default function ReceivePage() {
  const { t } = useTranslation(['receive', 'common'])
  const connectionType = useTransferStore((s) => s.connectionType)
  const errorCode = useTransferStore((s) => s.errorCode)
  const isPro = useSubscriptionStore((s) => s.active)

  const downloads = useReceiveDownloads()
  const step = useReceiveStep(downloads)
  const { totals, fileOffers, textOffers } = downloads
  const fileCount = fileOffers.length
  const textCount = textOffers.length

  const { title, description } = getReceivePageCopy(
    t,
    step,
    fileCount,
    textCount,
    totals.totalBytes
  )
  const failureCode = getConnectFailureCode(step, errorCode)
  const frameTitle = step === 'connecting' ? t('receive:page.join.title') : title

  const isRelay = connectionType === 'relay'
  const connectedBadge = (
    <div
      onClick={isRelay ? () => openSettingsPanel(isPro ? 'connection' : 'account') : undefined}
      className={`inline-flex items-center gap-1.5 rounded-full bg-success/12 px-2.5 py-1 text-[12px] font-semibold text-success ${
        isRelay ? 'cursor-pointer transition-opacity hover:opacity-80' : ''
      }`}
    >
      <span className='h-2 w-2 shrink-0 rounded-full bg-success' />
      {connectedStatusLabel(t, connectionType)}
      {isRelay ? <InfoIcon size={13} /> : null}
    </div>
  )

  function renderView() {
    if (failureCode) {
      return <ConnectFailureView code={failureCode} />
    }

    if (step === 'join') {
      return <ReceiveJoinView />
    }

    if (step === 'connecting') {
      return <ReceiveConnectingView />
    }

    if (isSessionOverStep(step)) {
      return (
        <ReceiveFileList
          hideFilesTitle
          pendingLabel={t('receive:errors.didntArrive')}
          footer={
            <Button onClick={clearSession} size='sm' variant='primary'>
              {t('common:actions.done')}
            </Button>
          }
        />
      )
    }

    if (step === 'reconnecting') {
      return (
        <ReceiveFileList
          hideFilesTitle
          pendingLabel={t('receive:status.waiting')}
          footer={
            <Button onClick={clearSession} size='sm' variant='secondary'>
              {t('common:actions.endSession')}
            </Button>
          }
        />
      )
    }

    return <ReceiveConnectedView />
  }

  if (step === 'completed') {
    return <ReceiveCompleteView />
  }

  function renderFooter() {
    if (failureCode) {
      return <ConnectFailureActions code={failureCode} />
    }
    if (step === 'connecting') {
      return (
        <TransferActionGroup>
          <Button onClick={clearSession} size='sm' variant='secondary'>
            {t('common:actions.cancel')}
          </Button>
        </TransferActionGroup>
      )
    }
    return undefined
  }

  return (
    <TransferCardFrame
      description={step === 'join' ? '' : description}
      title={frameTitle}
      badge={step === 'incoming_transfer' ? connectedBadge : undefined}
      headerRight={step === 'reconnecting' ? <Spinner size={18} /> : undefined}
      footer={renderFooter()}
    >
      {renderView()}
    </TransferCardFrame>
  )
}
