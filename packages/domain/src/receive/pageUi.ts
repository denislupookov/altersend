import type { TransferRole } from '@altersend/core'
import { formatFileSize } from '../format'
import type { Translate } from '../i18n'

export type ReceiveStep =
  | 'join'
  | 'connecting'
  | 'incoming_transfer'
  | 'reconnecting'
  | 'interrupted'
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
}

export function getReceiveStep({
  hasIncomingFiles,
  allDownloadsCompleted,
  role,
  peerCount,
  isReconnecting = false
}: ReceiveStepInput): ReceiveStep {
  if (hasIncomingFiles && allDownloadsCompleted) {
    return 'completed'
  }

  if (role !== 'receiver') {
    return 'join'
  }

  if (hasIncomingFiles && isReconnecting) {
    return 'reconnecting'
  }

  if (hasIncomingFiles && peerCount === 0) {
    return 'interrupted'
  }

  if (hasIncomingFiles) {
    return 'incoming_transfer'
  }

  return 'connecting'
}

export function getReceivePageCopy(
  t: Translate,
  step: ReceiveStep,
  incomingCount: number,
  totalBytes: number
): ReceivePageCopy {
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
    default: {
      const exhaustiveCheck: never = step
      return exhaustiveCheck
    }
  }
}

export function isConnectedStep(step: ReceiveStep): boolean {
  switch (step) {
    case 'incoming_transfer':
    case 'completed':
    case 'reconnecting':
    case 'interrupted':
      return true
    case 'join':
    case 'connecting':
      return false
    default: {
      const exhaustiveCheck: never = step
      return exhaustiveCheck
    }
  }
}
