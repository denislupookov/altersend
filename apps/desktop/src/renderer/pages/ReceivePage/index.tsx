import { Button, Spinner } from '@altersend/components'
import { InfoIcon } from '@altersend/components/icons'
import { useTranslation } from '@altersend/locales'
import { TransferActionGroup, TransferStatusPanel, TransferCardFrame } from '../../components'
import { openSettingsPanel } from '../../components/Settings'
import { ReceiveCompleteView } from './ReceiveCompleteView'
import { ReceiveConnectedView } from './ReceiveConnectedView'
import { ReceiveFileList } from './ReceiveFileList'
import { ReceiveJoinView } from './ReceiveJoinView'

import {
  clearSession,
  getReceivePageCopy,
  getReceiveStep,
  isSessionOverStep,
  useReceiveDownloads,
  useTransferStore
} from '@altersend/domain'

export default function ReceivePage() {
  const { t } = useTranslation(['receive', 'common'])
  const role = useTransferStore((s) => s.role)
  const peerCount = useTransferStore((s) => s.peerCount)
  const connectionType = useTransferStore((s) => s.connectionType)
  const isReconnecting = useTransferStore((s) => s.isReconnecting)
  const reconnectExhausted = useTransferStore((s) => s.reconnectExhausted)
  const sessionEndedByPeer = useTransferStore((s) => s.sessionEndedByPeer)

  const { totals, fileOffers, textOffers, allDownloaded } = useReceiveDownloads()
  const fileCount = fileOffers.length
  const textCount = textOffers.length

  const step = getReceiveStep({
    hasIncomingFiles: fileCount + textCount > 0,
    allDownloadsCompleted: allDownloaded,
    role,
    peerCount,
    isReconnecting,
    reconnectExhausted,
    sessionEndedByPeer
  })

  const { title, description } = getReceivePageCopy(
    t,
    step,
    fileCount,
    textCount,
    totals.totalBytes
  )

  const isRelay = connectionType === 'relay'
  const connectedBadge = (
    <div
      onClick={isRelay ? () => openSettingsPanel('connection') : undefined}
      className={`inline-flex items-center gap-1.5 rounded-full bg-success/12 px-2.5 py-1 text-[12px] font-semibold text-success ${
        isRelay ? 'cursor-pointer transition-opacity hover:opacity-80' : ''
      }`}
    >
      <span className='h-2 w-2 shrink-0 rounded-full bg-success' />
      {isRelay ? t('common:status.connectedViaRelay') : t('common:status.connected')}
      {isRelay ? <InfoIcon size={13} /> : null}
    </div>
  )

  function renderView() {
    if (step === 'join') {
      return <ReceiveJoinView />
    }

    if (step === 'connecting') {
      return (
        <TransferStatusPanel
          loading
          description={t('receive:page.handshake.description')}
          title={t('receive:page.handshake.title')}
        />
      )
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

  const footer =
    step === 'connecting' ? (
      <TransferActionGroup>
        <Button onClick={clearSession} size='sm' variant='secondary'>
          {t('common:actions.endSession')}
        </Button>
      </TransferActionGroup>
    ) : undefined

  return (
    <TransferCardFrame
      description={step === 'join' ? '' : description}
      title={title}
      badge={step === 'incoming_transfer' ? connectedBadge : undefined}
      headerRight={step === 'reconnecting' ? <Spinner size={18} /> : undefined}
      footer={footer}
    >
      {renderView()}
    </TransferCardFrame>
  )
}
