import type { ConnectReason, ConnectStage, TransferRole } from '@altersend/core'
import { formatFileSize, formatItemsCount } from '../format'
import type { Translate } from '../i18n'
import { isConnectFailure, type ConnectFailureCode } from '../transfer/errors'
import { TRANSFER_ERROR_CODES, type TransferErrorCode } from '../transfer/types'

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

export interface ConnectingStatusInput {
  relayBusy: boolean
  stage: ConnectStage | null
  reason: ConnectReason | null
  peerCount: number
}

type ConnectingStatusKey = ConnectStage | 'handshake' | 'relayBusy' | 'relayOff'

export function getConnectingStatusKey({
  relayBusy,
  stage,
  reason,
  peerCount
}: ConnectingStatusInput): ConnectingStatusKey {
  if (peerCount > 0) return 'handshake'
  if (relayBusy) return 'relayBusy'
  if (reason === 'relay-off') return 'relayOff'
  return stage ?? 'searching'
}

export type ConnectStatusTone = 'neutral' | 'success' | 'info' | 'warning'

export interface ConnectStatus {
  tone: ConnectStatusTone
  active: boolean
  label: string
  title: string
  description: string
}

const CONNECTING_TONES: Record<ConnectingStatusKey, ConnectStatusTone> = {
  searching: 'neutral',
  reaching: 'success',
  handshake: 'success',
  relaying: 'info',
  relayBusy: 'warning',
  relayOff: 'warning'
}

export function getConnectingStatus(t: Translate, input: ConnectingStatusInput): ConnectStatus {
  const key = getConnectingStatusKey(input)
  return {
    tone: CONNECTING_TONES[key],
    active: true,
    label: t(`receive:page.${key}.label`),
    title: t(`receive:page.${key}.title`),
    description: t(`receive:page.${key}.description`)
  }
}

type ConnectFailureKey = 'peerUnreachable' | 'directBlocked' | 'relayOff' | 'relayBusy'

const CONNECT_FAILURE_KEYS: Record<ConnectFailureCode, ConnectFailureKey> = {
  [TRANSFER_ERROR_CODES.peerUnreachable]: 'peerUnreachable',
  [TRANSFER_ERROR_CODES.directBlocked]: 'directBlocked',
  [TRANSFER_ERROR_CODES.relayOff]: 'relayOff',
  [TRANSFER_ERROR_CODES.relayBusy]: 'relayBusy'
}

export function getConnectFailureStatus(t: Translate, code: ConnectFailureCode): ConnectStatus {
  const key = CONNECT_FAILURE_KEYS[code]
  return {
    tone: 'warning',
    active: false,
    label: t(`receive:connectFailure.${key}.label`),
    title: t(`receive:connectFailure.${key}.title`),
    description: t(`receive:connectFailure.${key}.description`)
  }
}

export function getConnectFailureCode(
  step: ReceiveStep,
  errorCode: TransferErrorCode | null
): ConnectFailureCode | null {
  return step === 'join' && isConnectFailure(errorCode) ? errorCode : null
}

export type ConnectFailureFix = 'relaySettings' | 'upgrade'

export const CONNECT_FAILURE_FIX_LABEL: Record<ConnectFailureFix, string> = {
  relaySettings: 'receive:actions.openRelaySettings',
  upgrade: 'settings:account.upgradeToPro'
}

export function getConnectFailureFix(
  code: ConnectFailureCode,
  isPro: boolean
): ConnectFailureFix | null {
  if (code === TRANSFER_ERROR_CODES.relayOff) return 'relaySettings'
  if (code === TRANSFER_ERROR_CODES.relayBusy && !isPro) return 'upgrade'
  return null
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
        description: ''
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
