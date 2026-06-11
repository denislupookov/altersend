import { useMemo } from 'react'
import { Button } from '@altersend/components'
import { useTranslation } from '@altersend/locales'
import { TransferStatusPanel, TransferCardFrame } from '../../components/TransferPrimitives'
import { ReceiveCompleteView } from './ReceiveCompleteView'
import { ReceiveConnectedView } from './ReceiveConnectedView'
import { ReceiveDisconnectedView } from './ReceiveDisconnectedView'
import { ReceiveJoinView } from './ReceiveJoinView'

import {
  clearSession,
  formatFileSize,
  getDownloadTotals,
  getReceiveStep,
  isConnectedStep,
  type ReceiveStep,
  useTransferStore
} from '@altersend/domain'

function getReceivePageCopy(
  t: ReturnType<typeof useTranslation>['t'],
  step: ReceiveStep,
  incomingCount: number,
  totalBytes: number
) {
  switch (step) {
    case 'join':
      return {
        title: t('receive:page.join.title'),
        description: t('receive:page.join.description')
      }
    case 'connecting':
      return {
        title: t('receive:page.connecting.title'),
        description: t('receive:page.connecting.description')
      }
    case 'incoming_transfer':
      return {
        title: t('receive:page.incomingTransfer.title'),
        description: t('receive:page.incomingTransfer.description', {
          count: incomingCount,
          size: formatFileSize(totalBytes)
        })
      }
    case 'completed':
      return {
        title: t('receive:page.completed.title', { count: incomingCount }),
        description: ''
      }
    case 'reconnecting':
      return {
        title: t('receive:page.reconnecting.title'),
        description: t('receive:page.reconnecting.description')
      }
    case 'interrupted':
      return {
        title: t('receive:page.interrupted.title'),
        description: t('receive:page.interrupted.description')
      }
  }
}

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

  const totalBytes = incomingFileOffers.reduce((sum, f) => sum + f.size, 0)
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
      description={description}
      title={title}
      badge={connectedBadge}
      footer={footer}
    >
      {renderView()}
    </TransferCardFrame>
  )
}
