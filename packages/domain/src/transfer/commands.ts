import { dispatchToTransferStore, transferStore } from './store'
import { getTransferApi, reportError } from './binding'
import { createInitialUploadItems, getPhaseFromSelection } from '../send/draftModel'
import type { SelectedFile } from '../send/draftTypes'
import type {
  DownloadFileRequest,
  DownloadFilesReply,
  JoinReply,
  ShareFileRequest,
  ShareFilesReply
} from '@altersend/core'

const errorMessage = (e: unknown): string => (e instanceof Error ? e.message : String(e))

const setError = (message: string): void => {
  dispatchToTransferStore({ type: 'set_error', message })
}

export const clearSession = async (): Promise<void> => {
  dispatchToTransferStore({ type: 'clear_session' })
  try {
    await getTransferApi().worker.disconnect()
  } catch (error) {
    reportError('clearSession', error)
    setError(errorMessage(error))
  }
}

export const startSendSession = async (): Promise<string> => {
  try {
    const { topic } = await getTransferApi().worker.host()
    dispatchToTransferStore({ type: 'session_hosted', topic })
    return topic
  } catch (error) {
    reportError('startSendSession', error)
    setError(errorMessage(error))
    throw error
  }
}

export const joinSession = async (topic: string): Promise<JoinReply> => {
  dispatchToTransferStore({ type: 'join_requested' })
  try {
    return await getTransferApi().worker.join(topic)
  } catch (error) {
    reportError('joinSession', error)
    dispatchToTransferStore({ type: 'join_failed', message: errorMessage(error) })
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
    setError(errorMessage(error))
    throw error
  }
}

export const downloadFiles = async (files: DownloadFileRequest[]): Promise<DownloadFilesReply> => {
  try {
    return await getTransferApi().worker.downloadFiles(files)
  } catch (error) {
    reportError('downloadFiles', error)
    setError(errorMessage(error))
    throw error
  }
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
  void clearSession()
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
    setError(errorMessage(error))
  }
}
