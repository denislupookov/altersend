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

export interface TextSegment {
  text: string
  url?: string
}

const TRAILING_URL_PUNCT = new Set(['.', ',', ';', ':', '!', '?', ')', ']', '}', "'", '"'])

function stripTrailingPunctuation(url: string): string {
  let end = url.length
  while (end > 0 && TRAILING_URL_PUNCT.has(url[end - 1])) end--
  return url.slice(0, end)
}

export function linkifyText(text: string): TextSegment[] {
  const pattern = /https?:\/\/[^\s]+/g
  const segments: TextSegment[] = []
  let lastIndex = 0
  let match: RegExpExecArray | null

  while ((match = pattern.exec(text)) !== null) {
    const raw = stripTrailingPunctuation(match[0])
    if (match.index > lastIndex) segments.push({ text: text.slice(lastIndex, match.index) })
    segments.push({ text: raw, url: raw })
    lastIndex = match.index + raw.length
  }

  if (lastIndex < text.length) segments.push({ text: text.slice(lastIndex) })
  return segments
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

function pathSegments(p: string): string[] {
  return p.replace(/\\/g, '/').split('/').filter(Boolean)
}

type FileOffer = Extract<IncomingFileOffer, { kind: 'file' }>

export interface ReceiveFileRow {
  kind: 'file'
  offer: FileOffer
}

export interface ReceiveFolderRow {
  kind: 'folder'
  name: string
  offers: FileOffer[]
  totalSize: number
}

export type ReceiveRow = ReceiveFileRow | ReceiveFolderRow

export function groupReceiveRows(offers: IncomingFileOffer[]): ReceiveRow[] {
  const rows: ReceiveRow[] = []
  const folderRowIndex = new Map<string, number>()

  for (const offer of offers) {
    if (offer.kind !== 'file') continue
    const segments = pathSegments(offer.path)
    if (segments.length <= 1) {
      rows.push({ kind: 'file', offer })
      continue
    }

    const name = segments[0]
    const existing = folderRowIndex.get(name)

    if (existing === undefined) {
      folderRowIndex.set(name, rows.length)
      rows.push({ kind: 'folder', name, offers: [offer], totalSize: offer.size })
    } else {
      const row = rows[existing] as ReceiveFolderRow
      row.offers.push(offer)
      row.totalSize += offer.size
    }
  }

  return rows
}

export function getFolderRowDisplay(
  offers: FileOffer[],
  states: Record<string, DownloadItemState>
): DownloadRowDisplay {
  const totals = getDownloadTotals(offers, states)
  const anyFailed = offers.some((offer) => states[getOfferKey(offer)]?.status === 'failed')

  if (totals.completedCount === offers.length) {
    return {
      description: undefined,
      progressPercent: 100,
      status: { kind: 'saved', tone: 'success' },
      percent: 100,
      isActive: false,
      isCompleted: true
    }
  }

  if (anyFailed) {
    return {
      description: undefined,
      progressPercent: totals.bytesTransferred > 0 ? totals.percent : undefined,
      status: { kind: 'failed', tone: 'muted' },
      percent: totals.percent,
      isActive: false,
      isCompleted: false
    }
  }

  if (totals.activeCount > 0 || totals.completedCount > 0) {
    return {
      description: `${formatFileSize(totals.bytesTransferred)} / ${formatFileSize(totals.totalBytes)}`,
      progressPercent: totals.percent,
      status: { kind: 'progress', tone: totals.percent > 0 ? 'active' : 'muted' },
      percent: totals.percent,
      isActive: totals.activeCount > 0,
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
