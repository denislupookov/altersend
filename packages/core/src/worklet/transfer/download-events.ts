import type { StatusEvent, TransferStatus } from '../rpc/events'
import type {
  DownloadComplete,
  DownloadFailed,
  DownloadProgress,
  DownloadRequest
} from './control-channel'
import type { PeerSession } from './swarm'
import type { DownloadFileRequest } from '../rpc/protocol'
import { getFileName } from './utils'

export interface DownloadFailureDetail {
  resumable?: boolean
  cancelled?: boolean
}

export type DownloadFileOutcome =
  | { ok: true; savedTo: string }
  | { ok: false; message: string; resumable?: boolean; cancelled?: boolean }

export interface DownloadLifecycleEvent {
  transferId: string
  fileId: string
  fileName: string
  sourcePath: string
  targetPath: string
  totalBytes: number
  bytesTransferred?: number
  message?: string
  resumable?: boolean
  cancelled?: boolean
  pausable?: boolean
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
  const {
    transferId,
    fileId,
    totalBytes,
    bytesTransferred,
    message,
    resumable,
    cancelled,
    pausable
  } = event

  return {
    file: event.fileName,
    path: event.sourcePath,
    savedTo: event.targetPath,
    resumable,
    cancelled,
    pausable,
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
    savedTo: 'savedTo' in message ? message.savedTo : undefined,
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
    fileName: event.fileName,
    savedTo: event.targetPath
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

export interface DownloadReporterInit {
  file: DownloadFileRequest
  callbacks: DownloaderCallbacks
  targetPath: string
  totalBytes: number
  pausable?: boolean
}

export class DownloadReporter {
  private readonly callbacks: DownloaderCallbacks
  private readonly targetPath: string
  private readonly totalBytes: number
  private readonly pausable: boolean
  private readonly base: Omit<DownloadLifecycleEvent, 'bytesTransferred'>

  constructor({ file, callbacks, targetPath, totalBytes, pausable = false }: DownloadReporterInit) {
    this.callbacks = callbacks
    this.targetPath = targetPath
    this.totalBytes = totalBytes
    this.pausable = pausable
    this.base = {
      transferId: file.transferId,
      fileId: file.fileId,
      fileName: file.name ?? getFileName(file.path),
      sourcePath: file.path,
      targetPath,
      totalBytes
    }
  }

  started(): void {
    this.callbacks.onFileStart({ ...this.base, pausable: this.pausable, bytesTransferred: 0 })
  }

  progressed(bytesTransferred: number): void {
    this.callbacks.onFileProgress({ ...this.base, bytesTransferred })
  }

  completed(savedTo: string = this.targetPath): void {
    this.callbacks.onFileComplete({
      ...this.base,
      targetPath: savedTo,
      bytesTransferred: this.totalBytes
    })
  }

  failed(message: string, extra: DownloadFailureDetail = {}): DownloadFileOutcome {
    this.callbacks.onFileError({ ...this.base, message, ...extra })
    return { ok: false, message, ...extra }
  }
}
