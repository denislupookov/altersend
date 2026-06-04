import type { TransferRole } from '@altersend/core'

export type ReceiveStep =
  | 'join'
  | 'connecting'
  | 'incoming_transfer'
  | 'reconnecting'
  | 'interrupted'
  | 'completed'

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
