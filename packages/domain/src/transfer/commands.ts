import { dispatchToTransferStore, transferStore } from './store'
import { getTransferApi, reportError } from './binding'
import { getTransferDebugMessage, getTransferErrorCode } from './errors'
import { TRANSFER_ERROR_CODES, type TransferErrorCode } from './types'
import { createInitialUploadItems, getPhaseFromSelection } from '../send/draftModel'
import type { SelectedFile } from '../send/draftTypes'
import type {
  DownloadFileRequest,
  DownloadFilesReply,
  InviteResponseInput,
  JoinReply,
  ShareFileRequest,
  ShareFilesReply
} from '@altersend/core'
import type { IncomingInvite } from './types'

const setError = (code: TransferErrorCode, error: unknown): void => {
  dispatchToTransferStore({
    type: 'set_error',
    code: getTransferErrorCode(error, code),
    message: getTransferDebugMessage(error)
  })
}

export const clearSession = async (): Promise<void> => {
  dispatchToTransferStore({ type: 'clear_session' })
  try {
    await getTransferApi().worker.disconnect()
  } catch (error) {
    reportError('clearSession', error)
    setError(TRANSFER_ERROR_CODES.transferFailed, error)
  }
}

export const startSendSession = async (): Promise<string> => {
  try {
    const { topic } = await getTransferApi().worker.host()
    dispatchToTransferStore({ type: 'session_hosted', topic })
    return topic
  } catch (error) {
    reportError('startSendSession', error)
    setError(TRANSFER_ERROR_CODES.transferFailed, error)
    throw error
  }
}

export const hostPairingSession = async (): Promise<string> => {
  try {
    const { topic } = await getTransferApi().worker.hostPairing()
    return topic
  } catch (error) {
    reportError('hostPairingSession', error)
    throw error
  }
}

export const joinPairingSession = async (topic: string): Promise<JoinReply> => {
  try {
    return await getTransferApi().worker.joinPairing(topic)
  } catch (error) {
    reportError('joinPairingSession', error)
    throw error
  }
}

export const joinSession = async (topic: string): Promise<JoinReply> => {
  dispatchToTransferStore({ type: 'join_requested' })
  try {
    return await getTransferApi().worker.join(topic)
  } catch (error) {
    reportError('joinSession', error)
    dispatchToTransferStore({
      type: 'join_failed',
      code: getTransferErrorCode(error, TRANSFER_ERROR_CODES.joinFailed),
      message: getTransferDebugMessage(error)
    })
    throw error
  }
}

export const shareFiles = async (files: ShareFileRequest[]): Promise<ShareFilesReply> => {
  dispatchToTransferStore({ type: 'share_requested' })
  try {
    return await getTransferApi().worker.shareFiles(files)
  } catch (error) {
    reportError('shareFiles', error)
    dispatchToTransferStore({ type: 'role_changed', role: null })
    setError(TRANSFER_ERROR_CODES.transferFailed, error)
    throw error
  }
}

export const downloadFiles = async (files: DownloadFileRequest[]): Promise<DownloadFilesReply> => {
  try {
    return await getTransferApi().worker.downloadFiles(files)
  } catch (error) {
    reportError('downloadFiles', error)
    setError(TRANSFER_ERROR_CODES.downloadFailed, error)
    throw error
  }
}

export interface RememberVote {
  transferId: string
  peerKey: string
  vote: 'remember' | 'no'
  isMine: boolean
}

export const rememberVote = async (input: RememberVote): Promise<void> => {
  try {
    await getTransferApi().worker.rememberVote(input)
  } catch (error) {
    reportError('rememberVote', error)
    setError(TRANSFER_ERROR_CODES.transferFailed, error)
  }
}

export function subscribeToPeerConnected(cb: (peerKey: string) => void): () => void {
  return getTransferApi().onTransferEvent((event) => {
    if (event.type === 'status' && event.state === 'peer-connected' && event.peer) {
      cb(event.peer)
    }
  })
}

export function subscribeToPairingPeerConnected(cb: (peerKey: string) => void): () => void {
  return getTransferApi().onTransferEvent((event) => {
    if (event.type === 'pairing-peer-connected') cb(event.peerKey)
  })
}

export const loadPeers = async (): Promise<void> => {
  try {
    const peers = await getTransferApi().worker.peersList()
    dispatchToTransferStore({ type: 'set_peers', peers })
  } catch (error) {
    reportError('loadPeers', error)
  }
}

export const forgetPeer = async (pubkey: string): Promise<boolean> => {
  dispatchToTransferStore({ type: 'forget_peer', peerKey: pubkey })

  try {
    await getTransferApi().worker.forgetPeer(pubkey)
    await loadPeers()
    return true
  } catch (error) {
    reportError('forgetPeer', error)
    await loadPeers()
    return false
  }
}

export const requestPair = (transferId: string, peerKey: string): void => {
  dispatchToTransferStore({ type: 'request_pair_peer', peerKey })

  rememberVote({ transferId, peerKey, vote: 'remember', isMine: false })
}

export const inviteDevice = async (
  remoteDevicePubkey: string,
  topic: string,
  fileInfo?: { fileCount: number; totalSize: number }
): Promise<boolean> => {
  try {
    const { delivered } = await getTransferApi().worker.inviteDevice({
      remoteDevicePubkey,
      topic,
      ...fileInfo
    })
    return delivered
  } catch (error) {
    reportError('inviteDevice', error)
    return false
  }
}

export const respondToInvite = async (input: InviteResponseInput): Promise<boolean> => {
  try {
    const { delivered } = await getTransferApi().worker.respondToInvite(input)
    return delivered
  } catch (error) {
    reportError('respondToInvite', error)
    return false
  }
}

export const dismissInvite = (): void => {
  dispatchToTransferStore({ type: 'dismiss_invite' })
}

export const declineInvite = (invite: IncomingInvite): void => {
  dispatchToTransferStore({ type: 'dismiss_invite' })

  respondToInvite({
    remoteDevicePubkey: invite.remoteDevicePubkey,
    topic: invite.topic,
    response: 'declined'
  })
}

export const addSelectedFiles = (files: SelectedFile[]): void => {
  dispatchToTransferStore({ type: 'add_selected_files', files })
}

export const replaceSelectedFiles = (files: SelectedFile[]): void => {
  dispatchToTransferStore({ type: 'clear_send_draft' })
  if (files.length > 0) dispatchToTransferStore({ type: 'add_selected_files', files })
}

export const removeSelectedFile = (path: string): void => {
  dispatchToTransferStore({ type: 'remove_selected_file', path })
}

export function canJoinFromDeepLink(code: string): boolean {
  const { topic, role } = transferStore.getState()
  const activeTopic = topic.length > 0 ? topic : null

  if (role === 'sender') return false
  if (activeTopic && activeTopic !== code) return false

  return true
}

export const clearSenderFlow = (): void => {
  dispatchToTransferStore({ type: 'clear_send_draft' })
  clearSession()
}

export const continueShare = async (files: SelectedFile[]): Promise<void> => {
  if (files.length === 0) return

  const fileRequests: ShareFileRequest[] = files.map((file) => ({
    path: file.path,
    isTemporary: file.isTemporary
  }))

  dispatchToTransferStore({
    type: 'init_upload_items',
    items: createInitialUploadItems(files)
  })
  dispatchToTransferStore({ type: 'set_draft_phase', phase: 'preparing' })

  try {
    await startSendSession()
    await shareFiles(fileRequests)
    dispatchToTransferStore({ type: 'complete_all_uploads' })
    dispatchToTransferStore({ type: 'set_draft_phase', phase: 'ready' })
  } catch (error) {
    dispatchToTransferStore({ type: 'reset_uploading_items' })
    dispatchToTransferStore({
      type: 'set_draft_phase',
      phase: getPhaseFromSelection(files.length)
    })
    setError(TRANSFER_ERROR_CODES.transferFailed, error)
  }
}
