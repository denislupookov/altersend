import type { StatusEvent, TransferStatus } from '../rpc/events'
import type {
  DownloadComplete,
  DownloadFailed,
  DownloadProgress,
  DownloadRequest
} from './control-channel'
import type { PeerSession } from './swarm'

export interface DownloadLifecycleEvent {
  transferId: string
  fileId: string
  fileName: string
  sourcePath: string
  targetPath: string
  totalBytes: number
  bytesTransferred?: number
  message?: string
}

export interface DownloaderCallbacks {
  onFileStart: (event: DownloadLifecycleEvent) => void
  onFileProgress: (event: DownloadLifecycleEvent) => void
  onFileComplete: (event: DownloadLifecycleEvent) => void
  onFileError: (event: DownloadLifecycleEvent) => void
}

export type PeerDownloadStatus = Extract<
  TransferStatus,
  'peer-download-started' | 'peer-download-progress' | 'peer-downloaded' | 'peer-download-failed'
>

export function getDownloadFailureMessage(event: DownloadLifecycleEvent): string {
  return event.message ?? `Download failed for ${event.fileName}`
}

export function createDownloadStatusEvent(event: DownloadLifecycleEvent): Partial<StatusEvent> {
  const { transferId, fileId, totalBytes, bytesTransferred, message } = event

  return {
    file: event.fileName,
    path: event.sourcePath,
    savedTo: event.targetPath,
    transferId,
    fileId,
    totalBytes,
    bytesTransferred,
    message
  }
}

export function createDownloadStartEvent(event: DownloadLifecycleEvent): Partial<StatusEvent> {
  return {
    ...createDownloadStatusEvent(event),
    bytesTransferred: 0
  }
}

export function createPeerDownloadStatusEvent(
  message: DownloadRequest | DownloadProgress | DownloadComplete | DownloadFailed,
  session: PeerSession
): Partial<StatusEvent> {
  return {
    peer: session.peerKey,
    file: message.fileName,
    path: 'path' in message ? message.path : undefined,
    transferId: message.transferId,
    fileId: message.fileId,
    totalBytes: 'totalBytes' in message ? message.totalBytes : undefined,
    bytesTransferred: 'bytesTransferred' in message ? message.bytesTransferred : undefined,
    message: 'message' in message ? message.message : undefined
  }
}

export function createDownloadRequestMessage(event: DownloadLifecycleEvent): DownloadRequest {
  return {
    type: 'download-request',
    transferId: event.transferId,
    fileId: event.fileId,
    fileName: event.fileName,
    path: event.sourcePath,
    totalBytes: event.totalBytes
  }
}

export function createDownloadProgressMessage(event: DownloadLifecycleEvent): DownloadProgress {
  return {
    type: 'download-progress',
    transferId: event.transferId,
    fileId: event.fileId,
    fileName: event.fileName,
    bytesTransferred: event.bytesTransferred ?? 0,
    totalBytes: event.totalBytes
  }
}

export function createDownloadCompleteMessage(event: DownloadLifecycleEvent): DownloadComplete {
  return {
    type: 'download-complete',
    transferId: event.transferId,
    fileId: event.fileId,
    fileName: event.fileName
  }
}

export function createDownloadFailedMessage(event: DownloadLifecycleEvent): DownloadFailed {
  return {
    type: 'download-failed',
    transferId: event.transferId,
    fileId: event.fileId,
    fileName: event.fileName,
    message: getDownloadFailureMessage(event)
  }
}
