import type { DownloadFileRequest, IncomingFileOffer, RendererTransferEvent } from '@altersend/core'
import { formatFileSize } from '../format'

export type DownloadStatus = 'idle' | 'downloading' | 'completed' | 'failed'

export type SaveDestination = 'filesystem' | 'photos' | 'downloads'

export interface DownloadItemState {
  status: DownloadStatus
  bytesTransferred: number
  totalBytes: number
  savedTo?: string
  destination?: SaveDestination
  intendedDestination?: SaveDestination
  message?: string
}

export type DownloadRowStatusTone = 'muted' | 'active' | 'success'

export interface DownloadRowDisplay {
  description: string | undefined
  progressPercent: number | undefined
  status: {
    kind: 'saved' | 'failed' | 'progress' | 'ready'
    tone: DownloadRowStatusTone
    message?: string
  }
  percent: number
  isActive: boolean
  isCompleted: boolean
}

export interface DownloadTotals {
  totalBytes: number
  bytesTransferred: number
  completedCount: number
  activeCount: number
  percent: number
}

export type ReceiveDownloadStatusEvent = Extract<RendererTransferEvent, { type: 'status' }>

export function getOfferKey(file: IncomingFileOffer) {
  return file.id
}

function getProgressPercent(bytesTransferred: number, totalBytes: number) {
  if (totalBytes <= 0) return 0
  return Math.max(0, Math.min(100, Math.round((bytesTransferred / totalBytes) * 100)))
}

export function createDownloadStateMap(
  current: Record<string, DownloadItemState>,
  files: IncomingFileOffer[]
): Record<string, DownloadItemState> {
  const next: Record<string, DownloadItemState> = {}

  for (const file of files) {
    const key = getOfferKey(file)
    next[key] = current[key] ?? {
      status: 'idle',
      bytesTransferred: 0,
      totalBytes: file.kind === 'file' ? file.size : 0
    }
  }

  return next
}

export function getDownloadRowDisplay(
  file: IncomingFileOffer,
  state: DownloadItemState | undefined
): DownloadRowDisplay {
  const totalBytes = state?.totalBytes || (file.kind === 'file' ? file.size : 0)
  const percent = getProgressPercent(state?.bytesTransferred ?? 0, totalBytes)
  const isCompleted = state?.status === 'completed'
  const isActive = state?.status === 'downloading' && totalBytes > 0

  if (isCompleted) {
    return {
      description: undefined,
      progressPercent: 100,
      status: { kind: 'saved', tone: 'success' },
      percent: 100,
      isActive: false,
      isCompleted: true
    }
  }

  if (state?.status === 'failed') {
    return {
      description: undefined,
      progressPercent: state.bytesTransferred > 0 ? percent : undefined,
      status: { kind: 'failed', tone: 'muted', message: state.message },
      percent,
      isActive: false,
      isCompleted: false
    }
  }

  if (isActive) {
    return {
      description: `${formatFileSize(state!.bytesTransferred)} / ${formatFileSize(totalBytes)}`,
      progressPercent: percent,
      status: { kind: 'progress', tone: percent > 0 ? 'active' : 'muted' },
      percent,
      isActive: true,
      isCompleted: false
    }
  }

  return {
    description: undefined,
    progressPercent: undefined,
    status: { kind: 'ready', tone: 'muted' },
    percent: 0,
    isActive: false,
    isCompleted: false
  }
}

export function resolveOfferKey(offers: IncomingFileOffer[], message: ReceiveDownloadStatusEvent) {
  if (typeof message.fileId === 'string') {
    const match = offers.find((offer) => offer.id === message.fileId)
    if (match) return getOfferKey(match)
  }

  const match = offers.find(
    (offer) => offer.kind === 'file' && offer.name === message.file && offer.path === message.path
  )
  return match ? getOfferKey(match) : null
}

const pickNumber = (value: unknown, fallback: number): number =>
  typeof value === 'number' ? value : fallback

export function applyDownloadMessage(
  current: Record<string, DownloadItemState>,
  offerKey: string,
  message: ReceiveDownloadStatusEvent
): Record<string, DownloadItemState> {
  const previous = current[offerKey] ?? {
    status: 'idle' as const,
    bytesTransferred: 0,
    totalBytes: pickNumber(message.totalBytes, 0)
  }

  if (message.state === 'downloaded') {
    const totalBytes = pickNumber(message.totalBytes, previous.totalBytes)
    return {
      ...current,
      [offerKey]: {
        status: 'completed',
        bytesTransferred: totalBytes,
        totalBytes,
        savedTo: message.savedTo
      }
    }
  }

  if (message.state === 'download-failed') {
    return {
      ...current,
      [offerKey]: {
        ...previous,
        status: 'failed',
        message: message.message
      }
    }
  }

  return {
    ...current,
    [offerKey]: {
      status: 'downloading',
      bytesTransferred: pickNumber(message.bytesTransferred, previous.bytesTransferred),
      totalBytes: pickNumber(message.totalBytes, previous.totalBytes)
    }
  }
}

export function applyDownloadRouted(
  current: Record<string, DownloadItemState>,
  offerKey: string,
  routing: { destination: SaveDestination; intendedDestination: SaveDestination; savedTo?: string }
): Record<string, DownloadItemState> {
  const previous = current[offerKey]
  if (!previous) return current

  return {
    ...current,
    [offerKey]: {
      ...previous,
      destination: routing.destination,
      intendedDestination: routing.intendedDestination,
      savedTo: routing.savedTo ?? previous.savedTo
    }
  }
}

export function getDownloadTotals(
  files: IncomingFileOffer[],
  states: Record<string, DownloadItemState>
): DownloadTotals {
  const fileOffers = files.filter((f) => f.kind === 'file')
  const totalBytes = fileOffers.reduce((sum, file) => sum + file.size, 0)
  let bytesTransferred = 0
  let completedCount = 0
  let activeCount = 0

  for (const file of fileOffers) {
    const state = states[getOfferKey(file)]
    if (!state) continue

    if (state.status === 'completed') {
      completedCount += 1
      bytesTransferred += file.size
      continue
    }

    if (state.status === 'downloading') {
      activeCount += 1
      bytesTransferred += Math.min(state.bytesTransferred, state.totalBytes || file.size)
    }
  }

  return {
    totalBytes,
    bytesTransferred,
    completedCount,
    activeCount,
    percent: getProgressPercent(bytesTransferred, totalBytes)
  }
}

export function createSingleDownloadRequest(
  file: IncomingFileOffer,
  targetPath: string
): DownloadFileRequest {
  if (file.kind !== 'file') throw new Error('createSingleDownloadRequest: expected FileOffer')
  return {
    transferId: file.transferId,
    fileId: file.id,
    driveKey: file.driveKey,
    path: file.path,
    name: file.name,
    size: file.size,
    targetPath
  }
}

export function createDirectoryDownloadRequests(
  files: IncomingFileOffer[],
  targetDir: string
): DownloadFileRequest[] {
  return files
    .filter((f) => f.kind === 'file')
    .map((file) => ({
      transferId: file.transferId,
      fileId: file.id,
      driveKey: file.driveKey,
      path: file.path,
      name: file.name,
      size: file.size,
      targetDir
    }))
}
