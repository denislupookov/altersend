import {
  TRANSFER_ERROR_CODES,
  type IncomingFileOffer,
  type RememberedPeer,
  type RendererTransferEvent,
  type TransferErrorCode,
  type TransferRole
} from '@altersend/core'
import type {
  DownloadItemState,
  ReceiveDownloadStatusEvent,
  SaveDestination
} from '../receive/downloadModel'
import type { SharingStatusEvent } from '../send/draftModel'
import type { ConnectedPeer, PeerDownloadEvent } from '../send/shareModel'
import type { SelectedFile, SenderUploadItem } from '../send/draftTypes'
import type { SendDraftPhase } from '../send/pageUi'

export type { TransferRole }
export { TRANSFER_ERROR_CODES }
export type { TransferErrorCode }

export type ConnectionState = 'disconnected' | 'joining' | 'joined' | 'peer-connected'

export type PeerPairStatus = 'requested' | 'paired'

export interface IncomingPairRequest {
  transferId: string
  peerKey: string
  displayName: string
  deviceType: string
}

export interface IncomingInvite {
  remoteDevicePubkey: string
  displayName: string
  deviceType: string
  topic: string
  fileCount?: number
  textCount?: number
  totalSize?: number
}

export interface InviteResponse {
  remoteDevicePubkey: string
  topic: string
  response: 'declined'
  receivedAt: number
}

export interface RememberState {
  pairStatus: Record<string, PeerPairStatus>
  peerDisplayNames: Record<string, string>
  incomingRequest: IncomingPairRequest | null
  incomingInvite: IncomingInvite | null
  inviteResponses: Record<string, InviteResponse>
}

export interface TransferSessionState {
  topic: string
  connectionState: ConnectionState
  role: TransferRole | null
  peerCount: number
  isReconnecting: boolean
  incomingFileOffers: IncomingFileOffer[]
  receiveDownloadStates: Record<string, DownloadItemState>
  selectedFiles: SelectedFile[]
  draftPhase: SendDraftPhase
  uploadItems: SenderUploadItem[]
  peerDownloads: Record<string, PeerDownloadEvent>
  connectedPeers: Record<string, ConnectedPeer>
  errorCode: TransferErrorCode | null
  errorMessage: string | null
  transferId: string | null
  remember: RememberState
  peers: RememberedPeer[]
}

export type TransferAction =
  | { type: 'booted' }
  | { type: 'boot_failed'; code?: TransferErrorCode; message: string }
  | { type: 'session_hosted'; topic: string }
  | { type: 'join_requested' }
  | { type: 'share_requested' }
  | { type: 'join_failed'; code?: TransferErrorCode; message: string }
  | { type: 'clear_session' }
  | { type: 'set_error'; code?: TransferErrorCode; message: string }
  | { type: 'status_changed'; state: ConnectionState; peers?: number }
  | { type: 'role_changed'; role: TransferRole | null }
  | { type: 'apply_sharing_progress'; event: SharingStatusEvent }
  | { type: 'init_upload_items'; items: SenderUploadItem[] }
  | { type: 'complete_all_uploads' }
  | { type: 'reset_uploading_items' }
  | { type: 'peer_download_event'; event: Extract<RendererTransferEvent, { type: 'status' }> }
  | { type: 'peer_joined'; peerKey: string }
  | { type: 'peer_left'; peerKey: string }
  | { type: 'add_selected_files'; files: SelectedFile[] }
  | { type: 'remove_selected_file'; path: string }
  | { type: 'set_draft_phase'; phase: SendDraftPhase }
  | { type: 'clear_send_draft' }
  | { type: 'receive_download_event'; event: ReceiveDownloadStatusEvent }
  | {
      type: 'download_routed'
      offerKey: string
      destination: SaveDestination
      intendedDestination: SaveDestination
      savedTo?: string
    }
  | { type: 'transfer_ready'; files: IncomingFileOffer[] }
  | { type: 'reconnecting' }
  | { type: 'peer_unreachable' }
  | { type: 'remember_confirmed'; peerKey: string; displayName: string }
  | { type: 'remember_declined'; peerKey: string }
  | { type: 'remember_requested'; request: IncomingPairRequest }
  | { type: 'set_peers'; peers: RememberedPeer[] }
  | { type: 'forget_peer'; peerKey: string }
  | { type: 'request_pair_peer'; peerKey: string }
  | { type: 'invite_received'; invite: IncomingInvite }
  | { type: 'invite_response_received'; response: InviteResponse }
  | { type: 'dismiss_invite' }
