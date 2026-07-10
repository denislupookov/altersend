import type { RememberedPeer } from '../peers/remembered-peer'
import type { DeviceType } from '../identity/device-type'

export type TransferStatus =
  | 'peer-connected'
  | 'peer-disconnected'
  | 'sharing'
  | 'downloading'
  | 'download-progress'
  | 'downloaded'
  | 'download-failed'
  | 'peer-download-started'
  | 'peer-download-progress'
  | 'peer-downloaded'
  | 'peer-download-failed'
  | 'joining'
  | 'joined'
  | 'disconnected'
  | 'reconnecting'
  | 'connection-type'

export type TransferRole = 'sender' | 'receiver'

export const TRANSFER_ERROR_CODES = {
  peerUnreachable: 'peer_unreachable',
  invalidTopic: 'invalid_topic',
  joinFailed: 'join_failed',
  transferFailed: 'transfer_failed',
  downloadFailed: 'download_failed'
} as const

export type TransferErrorCode = (typeof TRANSFER_ERROR_CODES)[keyof typeof TRANSFER_ERROR_CODES]

export interface ReadyEvent {
  type: 'ready'
}

interface TopicEvent {
  type: 'topic'
  key: string
}

export interface StatusEvent {
  type: 'status'
  state: TransferStatus
  peer?: string
  peers?: number
  file?: string
  path?: string
  savedTo?: string
  transferId?: string
  fileId?: string
  totalBytes?: number
  bytesTransferred?: number
  message?: string
  connectionType?: 'direct' | 'relay'
}

export interface RoleEvent {
  type: 'role'
  role: TransferRole | null
}

export interface ErrorEvent {
  type: 'error'
  message: string
  code?: TransferErrorCode
}

export interface RememberConfirmedEvent {
  type: 'remember-confirmed'
  peerKey: string
  peer: RememberedPeer
}

export interface RememberDeclinedEvent {
  type: 'remember-declined'
  peerKey: string
  transferId: string
}

export interface RememberRequestedEvent {
  type: 'remember-requested'
  transferId: string
  peerKey: string
  displayName: string
  deviceType: DeviceType
}

export interface InviteReceivedEvent {
  type: 'invite-received'
  remoteDevicePubkey: string
  displayName: string
  deviceType: DeviceType
  topic: string
  fileCount?: number
  textCount?: number
  totalSize?: number
}

export interface InviteResponseReceivedEvent {
  type: 'invite-response-received'
  remoteDevicePubkey: string
  topic: string
  response: 'declined'
}

export interface PairingPeerConnectedEvent {
  type: 'pairing-peer-connected'
  peerKey: string
}

export type TransferIPCMessage =
  | ReadyEvent
  | TopicEvent
  | StatusEvent
  | RoleEvent
  | ErrorEvent
  | RememberConfirmedEvent
  | RememberDeclinedEvent
  | RememberRequestedEvent
  | InviteReceivedEvent
  | InviteResponseReceivedEvent
  | PairingPeerConnectedEvent

export function createReadyEvent(): ReadyEvent {
  return { type: 'ready' }
}

export function createStatusEvent(
  state: TransferStatus,
  extra: Partial<StatusEvent> = {}
): StatusEvent {
  return {
    type: 'status',
    state,
    ...extra
  }
}

export function createRoleEvent(role: TransferRole | null): RoleEvent {
  return { type: 'role', role }
}

export function createRememberConfirmedEvent(
  peerKey: string,
  peer: RememberedPeer
): RememberConfirmedEvent {
  return { type: 'remember-confirmed', peerKey, peer }
}

export function createRememberDeclinedEvent(
  peerKey: string,
  transferId: string
): RememberDeclinedEvent {
  return { type: 'remember-declined', peerKey, transferId }
}

export function createRememberRequestedEvent(
  request: Omit<RememberRequestedEvent, 'type'>
): RememberRequestedEvent {
  return { type: 'remember-requested', ...request }
}

export function createInviteReceivedEvent(
  invite: Omit<InviteReceivedEvent, 'type'>
): InviteReceivedEvent {
  return { type: 'invite-received', ...invite }
}

export function createInviteResponseReceivedEvent(
  response: Omit<InviteResponseReceivedEvent, 'type'>
): InviteResponseReceivedEvent {
  return { type: 'invite-response-received', ...response }
}

export function createPairingPeerConnectedEvent(peerKey: string): PairingPeerConnectedEvent {
  return { type: 'pairing-peer-connected', peerKey }
}

export function createErrorEvent(message: string, code?: TransferErrorCode): ErrorEvent {
  return {
    type: 'error',
    message,
    ...(code ? { code } : {})
  }
}
