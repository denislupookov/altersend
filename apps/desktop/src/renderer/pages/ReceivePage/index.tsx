import { useMemo } from 'react'
import { Button } from '@altersend/components'
import { InfoIcon } from '@altersend/components/icons'
import { useTranslation } from '@altersend/locales'
import { TransferStatusPanel, TransferCardFrame } from '../../components'
import { openSettingsPanel } from '../../components/Settings'
import { ReceiveCompleteView } from './ReceiveCompleteView'
import { ReceiveConnectedView } from './ReceiveConnectedView'
import { ReceiveDisconnectedView } from './ReceiveDisconnectedView'
import { ReceiveJoinView } from './ReceiveJoinView'

import {
  clearSession,
  getDownloadTotals,
  getReceivePageCopy,
  getReceiveStep,
  isConnectedStep,
  useTransferStore
} from '@altersend/domain'

export default function ReceivePage() {
  const { t } = useTranslation(['receive', 'common'])
  const role = useTransferStore((s) => s.role)
  const incomingFileOffers = useTransferStore((s) => s.incomingFileOffers)
  const receiveDownloadStates = useTransferStore((s) => s.receiveDownloadStates)
  const peerCount = useTransferStore((s) => s.peerCount)
  const connectionType = useTransferStore((s) => s.connectionType)

  const hasIncomingFiles = incomingFileOffers.length > 0
  const totals = useMemo(
    () => getDownloadTotals(incomingFileOffers, receiveDownloadStates),
    [incomingFileOffers, receiveDownloadStates]
  )
  const fileCount = incomingFileOffers.filter((f) => f.kind === 'file').length
  const textCount = incomingFileOffers.length - fileCount
  const hasDownloadableFiles = fileCount > 0
  const allDownloadsCompleted = hasDownloadableFiles && totals.completedCount === fileCount

  const step = getReceiveStep({
    hasIncomingFiles,
    allDownloadsCompleted,
    role,
    peerCount
  })

  const { title, description } = getReceivePageCopy(
    t,
    step,
    fileCount,
    textCount,
    totals.totalBytes
  )

  const isRelay = connectionType === 'relay'
  const connectedBadge =
    isConnectedStep(step) && step !== 'completed' && step !== 'interrupted' ? (
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
    ) : undefined

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

    if (step === 'interrupted') {
      return <ReceiveDisconnectedView />
    }

    if (isConnectedStep(step)) {
      return <ReceiveConnectedView />
    }

    return null
  }

  if (step === 'completed') {
    return <ReceiveCompleteView />
  }

  const footer =
    step === 'connecting' ? (
      <div className='flex items-center justify-end gap-2.5'>
        <Button onClick={clearSession} size='sm' variant='secondary'>
          {t('common:actions.endSession')}
        </Button>
      </div>
    ) : undefined

  return (
    <TransferCardFrame
      description={step === 'join' ? '' : description}
      title={title}
      badge={connectedBadge}
      footer={footer}
    >
      {renderView()}
    </TransferCardFrame>
  )
}
