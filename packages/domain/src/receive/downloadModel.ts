import type { DownloadFileRequest, IncomingFileOffer, RendererTransferEvent } from '@altersend/core'
import { formatFileSize } from '../format'
import {
  sumTransferRates,
  toProgressPercent,
  type TransferProgress,
  type TransferRate
} from '../transfer/rate'

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
  resumable?: boolean
  starting?: boolean
  queued?: boolean
  pausable?: boolean
  pausedByUser?: boolean
  retriesExhausted?: boolean
}

export function isAutoResumable(state: DownloadItemState | undefined): boolean {
  if (!isResumable(state)) return false
  return state?.pausedByUser !== true && state?.retriesExhausted !== true
}

export type DownloadRowStatusTone = 'muted' | 'active' | 'success'

export interface DownloadRowDisplay {
  description: string | undefined
  rateLabel?: string
  progressPercent: number | undefined
  status: {
    kind: 'saved' | 'failed' | 'paused' | 'resuming' | 'progress' | 'ready' | 'waiting'
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

function getRemainingBytes(
  offers: IncomingFileOffer[],
  states: Record<string, DownloadItemState>
): number {
  const totals = getDownloadTotals(offers, states)
  return Math.max(0, totals.totalBytes - totals.bytesTransferred)
}

export function getFolderTransferRate(
  offers: IncomingFileOffer[],
  states: Record<string, DownloadItemState>,
  rates: Record<string, TransferRate>
): TransferRate {
  const active = offers.filter((offer) => states[getOfferKey(offer)]?.status === 'downloading')
  return sumTransferRates(
    active.map((offer) => rates[getOfferKey(offer)]),
    getRemainingBytes(offers, states)
  )
}

export function getActiveDownloadProgress(
  states: Record<string, DownloadItemState>
): Record<string, TransferProgress> {
  const progress: Record<string, TransferProgress> = {}

  for (const [key, state] of Object.entries(states)) {
    if (state.status !== 'downloading' || state.totalBytes <= 0) continue
    progress[key] = { bytesTransferred: state.bytesTransferred, totalBytes: state.totalBytes }
  }

  return progress
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

function stoppedRowKind(state: DownloadItemState): DownloadRowDisplay['status']['kind'] {
  if (state.queued) return 'waiting'
  return state.resumable ? 'paused' : 'failed'
}

export function getDownloadRowDisplay(
  file: IncomingFileOffer,
  state: DownloadItemState | undefined,
  transferActive = false,
  rateLabel?: string
): DownloadRowDisplay {
  const totalBytes = state?.totalBytes || (file.kind === 'file' ? file.size : 0)
  const percent = toProgressPercent(state?.bytesTransferred ?? 0, totalBytes)
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
      description: state.resumable
        ? `${formatFileSize(state.bytesTransferred)} / ${formatFileSize(totalBytes)}`
        : undefined,
      progressPercent: state.bytesTransferred > 0 ? percent : undefined,
      status: {
        kind: stoppedRowKind(state),
        tone: 'muted',
        message: state.message
      },
      percent,
      isActive: false,
      isCompleted: false
    }
  }

  if (isActive && state!.starting && state!.bytesTransferred > 0) {
    return {
      description: `${formatFileSize(state!.bytesTransferred)} / ${formatFileSize(totalBytes)}`,
      progressPercent: percent,
      status: { kind: 'resuming', tone: 'muted' },
      percent,
      isActive: true,
      isCompleted: false
    }
  }

  if (isActive) {
    return {
      description: `${formatFileSize(state!.bytesTransferred)} / ${formatFileSize(totalBytes)}`,
      rateLabel,
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
    status: { kind: transferActive || state?.queued ? 'waiting' : 'ready', tone: 'muted' },
    percent: 0,
    isActive: false,
    isCompleted: false
  }
}

export function getDownloadStatusKey(row: DownloadRowDisplay): string | null {
  switch (row.status.kind) {
    case 'saved':
      return 'receive:status.saved'
    case 'failed':
      return 'errors:transfer.downloadFailed'
    case 'paused':
      return 'receive:status.paused'
    case 'resuming':
      return 'receive:status.resuming'
    case 'progress':
      return 'receive:status.percent'
    case 'waiting':
      return 'receive:status.waiting'
    case 'ready':
      return null
  }
}

export type DownloadRowAction =
  | { kind: 'resume'; targetPath: string }
  | { kind: 'pause' }
  | { kind: 'open'; savedTo: string }
  | null

export function getDownloadRowAction(
  row: DownloadRowDisplay,
  state: DownloadItemState | undefined
): DownloadRowAction {
  if (row.isCompleted && state?.savedTo) return { kind: 'open', savedTo: state.savedTo }
  if (row.status.kind === 'paused' && state?.savedTo) {
    return { kind: 'resume', targetPath: state.savedTo }
  }
  if (row.isActive && state?.pausable === true) return { kind: 'pause' }
  return null
}

export type PrimaryDownloadAction = 'downloading' | 'resume-all' | 'download-all' | null

export interface PrimaryDownloadInput {
  hasFiles: boolean
  allDownloaded: boolean
  peerCount: number
  isDownloading: boolean
  canResumeAll: boolean
}

export function getPrimaryDownloadAction({
  hasFiles,
  allDownloaded,
  peerCount,
  isDownloading,
  canResumeAll
}: PrimaryDownloadInput): PrimaryDownloadAction {
  if (!hasFiles || allDownloaded || peerCount === 0) return null
  if (isDownloading) return 'downloading'
  return canResumeAll ? 'resume-all' : 'download-all'
}

export type FolderRowAction = 'pause' | 'resume' | null

export function canStopDownload(state: DownloadItemState | undefined): boolean {
  if (!state) return false
  if (state.status === 'downloading') return state.pausable === true
  return state.queued === true
}

export function getFolderRowAction(
  offers: IncomingFileOffer[],
  states: Record<string, DownloadItemState>
): FolderRowAction {
  let resumable = false
  for (const offer of offers) {
    const state = states[getOfferKey(offer)]
    if (canStopDownload(state)) return 'pause'
    if (isResumable(state)) resumable = true
  }
  return resumable ? 'resume' : null
}

export function isResumable(state: DownloadItemState | undefined): boolean {
  return state?.status === 'failed' && state.resumable === true && !!state.savedTo
}

export function getPendingDownloadOffers(
  offers: IncomingFileOffer[],
  states: Record<string, DownloadItemState>
): IncomingFileOffer[] {
  return offers.filter(
    (offer) => offer.kind === 'file' && states[getOfferKey(offer)]?.status !== 'completed'
  )
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

export function markDownloadsQueued(
  current: Record<string, DownloadItemState>,
  offerKeys: string[],
  queued: boolean
): Record<string, DownloadItemState> {
  const next = { ...current }
  for (const key of offerKeys) {
    const previous = next[key]
    if (!previous || previous.status === 'downloading') continue
    next[key] = { ...previous, queued: queued || undefined }
  }
  return next
}

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
    if (message.cancelled === true && previous.bytesTransferred === 0) {
      return {
        ...current,
        [offerKey]: {
          ...previous,
          status: 'idle',
          queued: undefined,
          starting: undefined,
          message: undefined,
          resumable: undefined,
          savedTo: undefined
        }
      }
    }

    return {
      ...current,
      [offerKey]: {
        ...previous,
        status: 'failed',
        queued: undefined,
        message: message.message,
        savedTo: message.savedTo ?? previous.savedTo,
        resumable: message.resumable === true || previous.resumable === true,
        pausedByUser: message.cancelled === true || undefined,
        retriesExhausted: undefined
      }
    }
  }

  const starting = message.state === 'downloading' && isResumable(previous)

  return {
    ...current,
    [offerKey]: {
      ...previous,
      status: 'downloading',
      resumable: undefined,
      queued: undefined,
      pausable: message.pausable === true || previous.pausable,
      starting,
      bytesTransferred:
        starting && isResumable(previous)
          ? previous.bytesTransferred
          : pickNumber(message.bytesTransferred, previous.bytesTransferred),
      totalBytes: pickNumber(message.totalBytes, previous.totalBytes),
      savedTo: message.savedTo ?? previous.savedTo
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
      continue
    }

    if (isResumable(state)) {
      bytesTransferred += Math.min(state.bytesTransferred, state.totalBytes || file.size)
    }
  }

  return {
    totalBytes,
    bytesTransferred,
    completedCount,
    activeCount,
    percent: toProgressPercent(bytesTransferred, totalBytes)
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
  states: Record<string, DownloadItemState>,
  rateLabel?: string
): DownloadRowDisplay {
  const totals = getDownloadTotals(offers, states)
  const anyFailed = offers.some((offer) => {
    const state = states[getOfferKey(offer)]
    return state?.status === 'failed' && !isResumable(state)
  })
  const anyPaused = offers.some((offer) => isResumable(states[getOfferKey(offer)]))

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

  if (anyFailed && totals.activeCount === 0 && !anyPaused) {
    return {
      description: undefined,
      progressPercent: totals.bytesTransferred > 0 ? totals.percent : undefined,
      status: { kind: 'failed', tone: 'muted' },
      percent: totals.percent,
      isActive: false,
      isCompleted: false
    }
  }

  if (totals.activeCount > 0 || totals.completedCount > 0 || anyPaused) {
    return {
      description: `${formatFileSize(totals.bytesTransferred)} / ${formatFileSize(totals.totalBytes)}`,
      rateLabel: totals.activeCount > 0 ? rateLabel : undefined,
      progressPercent: totals.percent,
      status: {
        kind: totals.activeCount === 0 && anyPaused ? 'paused' : 'progress',
        tone: totals.activeCount > 0 && totals.percent > 0 ? 'active' : 'muted'
      },
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
  targetPath: string,
  overwrite = false
): DownloadFileRequest {
  if (file.kind !== 'file') throw new Error('createSingleDownloadRequest: expected FileOffer')
  return {
    transferId: file.transferId,
    fileId: file.id,
    path: file.path,
    name: file.name,
    size: file.size,
    targetPath,
    overwrite
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
      path: file.path,
      name: file.name,
      size: file.size,
      targetDir
    }))
}

export interface DownloadRowLabels {
  status?: string
  resume: string
  pause: string
  open: string
}

export interface PrimaryLabelOptions {
  percent: number
  totalBytes?: number
}

export function getPrimaryDownloadLabel(
  t: (key: string, vars?: Record<string, unknown>) => string,
  action: PrimaryDownloadAction,
  { percent, totalBytes }: PrimaryLabelOptions
): string {
  switch (action) {
    case 'downloading':
      return t('receive:actions.downloadingPercent', { percent })
    case 'resume-all':
      return t('receive:actions.resumeAll')
    default:
      return totalBytes && totalBytes > 0
        ? t('receive:actions.downloadAllWithSize', { size: formatFileSize(totalBytes) })
        : t('receive:actions.downloadAll')
  }
}

export function getDownloadRowLabels(
  t: (key: string, vars?: Record<string, unknown>) => string,
  row: DownloadRowDisplay,
  pendingLabel?: string
): DownloadRowLabels {
  const key = getDownloadStatusKey(row)
  const status = pendingLabel && !row.isCompleted ? pendingLabel : undefined
  return {
    status: status ?? (key ? t(key, { percent: row.percent }) : undefined),
    resume: t('receive:actions.resume'),
    pause: t('receive:actions.stop'),
    open: t('receive:actions.open')
  }
}
