import type { TransferRole } from '@altersend/core'
import { formatFileSize, formatItemsCount } from '../format'
import type { Translate } from '../i18n'

export type ReceiveStep =
  | 'join'
  | 'connecting'
  | 'incoming_transfer'
  | 'reconnecting'
  | 'interrupted'
  | 'session_ended'
  | 'completed'

export interface ReceivePageCopy {
  title: string
  description: string
}

interface ReceiveStepInput {
  hasIncomingFiles: boolean
  allDownloadsCompleted: boolean
  role: TransferRole | null
  peerCount: number
  isReconnecting?: boolean
  reconnectExhausted?: boolean
  sessionEndedByPeer?: boolean
}

export function getReceiveStep({
  hasIncomingFiles,
  allDownloadsCompleted,
  role,
  peerCount,
  isReconnecting = false,
  reconnectExhausted = false,
  sessionEndedByPeer = false
}: ReceiveStepInput): ReceiveStep {
  if (hasIncomingFiles && allDownloadsCompleted) {
    return 'completed'
  }

  if (role !== 'receiver') {
    return 'join'
  }

  if (hasIncomingFiles && sessionEndedByPeer) {
    return 'session_ended'
  }

  if (hasIncomingFiles && reconnectExhausted) {
    return 'interrupted'
  }

  if (hasIncomingFiles && (isReconnecting || peerCount === 0)) {
    return 'reconnecting'
  }

  if (hasIncomingFiles) {
    return 'incoming_transfer'
  }

  return 'connecting'
}

export function isSessionOverStep(step: ReceiveStep): boolean {
  return step === 'interrupted' || step === 'session_ended'
}

export function getReceivePageCopy(
  t: Translate,
  step: ReceiveStep,
  fileCount: number,
  textCount: number,
  totalBytes: number
): ReceivePageCopy {
  const incomingCount = fileCount + textCount
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
    case 'incoming_transfer': {
      if (textCount > 0) {
        const label = formatItemsCount(fileCount, textCount, t)
        return {
          title: t('receive:page.incomingTransfer.title'),
          description: totalBytes > 0 ? `${label} · ${formatFileSize(totalBytes)}` : label
        }
      }
      return {
        title: t('receive:page.incomingTransfer.title'),
        description: t('receive:page.incomingTransfer.description', {
          count: incomingCount,
          size: formatFileSize(totalBytes)
        })
      }
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
        description: ''
      }
    case 'session_ended':
      return {
        title: t('receive:page.senderEnded.title'),
        description: ''
      }
    default: {
      const exhaustiveCheck: never = step
      return exhaustiveCheck
    }
  }
}
