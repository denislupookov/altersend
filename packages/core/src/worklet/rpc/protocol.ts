import b4a from 'b4a'
import type { FileOffer, PeerControlMessage } from '../transfer/control-channel'
import type { RememberedPeer } from '../peers/remembered-peer'
import type { DeviceSecretInit } from '../identity/device-identity-store'
import type {
  ErrorEvent,
  InviteReceivedEvent,
  InviteResponseReceivedEvent,
  PairingPeerConnectedEvent,
  ReadyEvent,
  RememberConfirmedEvent,
  RememberDeclinedEvent,
  RememberRequestedEvent,
  RoleEvent,
  StatusEvent,
  TransferErrorCode,
  TransferRole
} from './events'
import { API, API_BY_VALUE } from './commands'
import type { TransferMethod } from './commands'

export { API, API_BY_VALUE }
export type { TransferErrorCode, TransferRole, TransferMethod }
export type { DeviceSecretInit }

export interface DownloadFileRequest {
  transferId: string
  fileId: string
  driveKey: string
  path: string
  name?: string
  size?: number
  targetDir?: string
  targetPath?: string
}

export interface HostReply {
  topic: string
}

export interface JoinReply {
  state: 'joined'
}

export interface ShareFileRequest {
  path: string
  isTemporary?: boolean
}

export interface ShareFilesReply {
  acceptedFiles: number
}

export interface DownloadFileResult {
  fileId?: string
  fileName: string
  ok: boolean
  savedTo?: string
  message?: string
}

export interface DownloadFilesReply {
  files: DownloadFileResult[]
}

export interface DisconnectReply {
  state: 'disconnected'
}

export interface RememberVoteInput {
  transferId: string
  peerKey: string
  vote: 'remember' | 'no'
  isMine: boolean
}

export interface RememberVoteReply {
  ok: true
}

export interface InviteDeviceInput {
  remoteDevicePubkey: string
  topic: string
  fileCount?: number
  totalSize?: number
}

export interface InviteDeviceReply {
  delivered: boolean
}

export interface InviteResponseInput {
  remoteDevicePubkey: string
  topic: string
  response: 'declined'
}

export interface InviteResponseReply {
  delivered: boolean
}

export interface InitDeviceSecretReply {
  secretKey: string | null
}

export interface RPCErrorPayload {
  code: 'BAD_REQUEST' | 'UNKNOWN_COMMAND' | 'INTERNAL_ERROR'
  message: string
  transferErrorCode?: TransferErrorCode
}

interface RPCSuccessPayload<T> {
  ok: true
  data: T
}

interface RPCErrorResponse {
  ok: false
  error: RPCErrorPayload
}

export type RPCResponse<T> = RPCSuccessPayload<T> | RPCErrorResponse

type WorkerReadyEvent = ReadyEvent
export type RendererTransferEvent =
  | StatusEvent
  | ErrorEvent
  | RoleEvent
  | RememberConfirmedEvent
  | RememberDeclinedEvent
  | RememberRequestedEvent
  | InviteReceivedEvent
  | InviteResponseReceivedEvent
  | PairingPeerConnectedEvent
  | PeerControlMessage
export type WorkerTransferEvent = WorkerReadyEvent | RendererTransferEvent
export type IncomingFileOffer = FileOffer

export interface TransferRPC {
  host(): Promise<HostReply>
  join(topic: string): Promise<JoinReply>
  shareFiles(files: ShareFileRequest[]): Promise<ShareFilesReply>
  downloadFiles(files: DownloadFileRequest[]): Promise<DownloadFilesReply>
  disconnect(): Promise<DisconnectReply>
  closePeers(): Promise<void>
  rememberVote(input: RememberVoteInput): Promise<RememberVoteReply>
  peersList(): Promise<RememberedPeer[]>
  inviteDevice(input: InviteDeviceInput): Promise<InviteDeviceReply>
  respondToInvite(input: InviteResponseInput): Promise<InviteResponseReply>
  forgetPeer(pubkey: string): Promise<void>
  initDeviceSecret(init: DeviceSecretInit): Promise<InitDeviceSecretReply>
  hostPairing(): Promise<HostReply>
  joinPairing(topic: string): Promise<JoinReply>
}

export class BadRequestError extends Error {
  transferErrorCode?: TransferErrorCode

  constructor(message: string, transferErrorCode?: TransferErrorCode) {
    super(message)
    this.name = 'BadRequestError'
    this.transferErrorCode = transferErrorCode
  }
}

export function encodeRPCPayload(value: unknown): string {
  return JSON.stringify(value ?? null)
}

export function decodeRPCPayload<T>(data: Uint8Array | ArrayBuffer | string | null): T | null {
  if (!data) return null

  let source: string
  if (typeof data === 'string') {
    source = data
  } else {
    const bytes = data instanceof Uint8Array ? data : new Uint8Array(data)
    if (bytes.byteLength === 0) return null
    source = b4a.toString(bytes, 'utf8')
  }
  if (source.length === 0) return null

  try {
    return JSON.parse(source) as T
  } catch (err) {
    console.warn('decodeRPCPayload: malformed JSON payload', err)
    return null
  }
}

export function encodeRPCSuccess<T>(value: T): string {
  return encodeRPCPayload({
    ok: true,
    data: value
  })
}

export function encodeRPCError(
  message: string,
  code: RPCErrorPayload['code'] = 'INTERNAL_ERROR',
  transferErrorCode?: TransferErrorCode
): string {
  return encodeRPCPayload({
    ok: false,
    error: {
      code,
      message,
      ...(transferErrorCode ? { transferErrorCode } : {})
    }
  })
}
