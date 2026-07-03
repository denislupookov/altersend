import { useMemo } from 'react'
import { Button } from '@altersend/components'
import { useTranslation } from '@altersend/locales'
import { TransferStatusPanel, TransferCardFrame } from '../../components'
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

  const hasIncomingFiles = incomingFileOffers.length > 0
  const totals = useMemo(
    () => getDownloadTotals(incomingFileOffers, receiveDownloadStates),
    [incomingFileOffers, receiveDownloadStates]
  )
  const allDownloadsCompleted =
    hasIncomingFiles && totals.completedCount === incomingFileOffers.length

  const step = getReceiveStep({
    hasIncomingFiles,
    allDownloadsCompleted,
    role,
    peerCount
  })

  const totalBytes = incomingFileOffers.reduce(
    (sum, f) => sum + (f.kind === 'file' ? f.size : 0),
    0
  )
  const { title, description } = getReceivePageCopy(t, step, incomingFileOffers.length, totalBytes)

  const connectedBadge =
    isConnectedStep(step) && step !== 'completed' && step !== 'interrupted' ? (
      <div className='inline-flex items-center gap-2 rounded-full border border-success/22 bg-success/8 px-3 py-1.5 text-[12px] font-medium text-success'>
        <span className='h-1.5 w-1.5 shrink-0 rounded-full bg-success' />
        {t('common:status.connected')}
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
