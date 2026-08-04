import type { RendererTransferEvent } from '@altersend/core'
import { toProgressPercent } from '../transfer/rate'

export interface PeerEvent {
  id: string
  type: 'connected' | 'disconnected'
  timestamp: number
}

export interface ConnectedPeer {
  peerKey: string
  connectedAt: number
  disconnectedAt?: number
}

export type PeerDownloadState = 'started' | 'progress' | 'completed' | 'failed' | 'paused'

export interface PeerDownloadEvent {
  id: string
  peerKey: string
  fileName: string
  state: PeerDownloadState
  bytesTransferred: number
  totalBytes: number
  message?: string
  updatedAt: number
}

export type PeerListStatus =
  | 'online'
  | 'downloading'
  | 'downloaded'
  | 'paused'
  | 'failed'
  | 'disconnected'

export interface PeerStatusData {
  status: PeerListStatus
  completedCount: number
  sortKey: number
  progressPercent?: number
  failedFileName?: string
  transferredBytes?: number
  totalForDisplay?: number
  inFlightFileName?: string
}

function getDownloadEventKey(message: Extract<RendererTransferEvent, { type: 'status' }>) {
  return `${message.peer ?? 'unknown-peer'}:${message.fileId ?? message.file ?? 'unknown-file'}`
}

function getPeerDownloadState(
  message: Extract<RendererTransferEvent, { type: 'status' }>
): PeerDownloadState | null {
  switch (message.state) {
    case 'peer-download-started':
      return 'started'
    case 'peer-download-progress':
      return 'progress'
    case 'peer-downloaded':
      return 'completed'
    case 'peer-download-failed':
      return message.paused === true ? 'paused' : 'failed'
    default:
      return null
  }
}

export function applyPeerDownloadEvent(
  current: Record<string, PeerDownloadEvent>,
  message: Extract<RendererTransferEvent, { type: 'status' }>
): Record<string, PeerDownloadEvent> {
  const nextState = getPeerDownloadState(message)
  if (!nextState || !message.peer || !message.file) return current

  const key = getDownloadEventKey(message)
  const previous = current[key]

  return {
    ...current,
    [key]: {
      id: key,
      peerKey: message.peer,
      fileName: message.file,
      state: nextState,
      bytesTransferred:
        typeof message.bytesTransferred === 'number'
          ? message.bytesTransferred
          : (previous?.bytesTransferred ?? 0),
      totalBytes:
        typeof message.totalBytes === 'number' ? message.totalBytes : (previous?.totalBytes ?? 0),
      message: message.message,
      updatedAt: Date.now()
    }
  }
}

export interface EventsSummary {
  failed: PeerDownloadEvent | null
  paused: PeerDownloadEvent | null
  inFlight: PeerDownloadEvent | null
  newest: PeerDownloadEvent
  completedCount: number
  transferredBytes: number
  sumOfKnownTotals: number
}

export function summarizeEvents(events: PeerDownloadEvent[]): EventsSummary | null {
  if (events.length === 0) return null

  let failed: PeerDownloadEvent | null = null
  let paused: PeerDownloadEvent | null = null
  let inFlight: PeerDownloadEvent | null = null
  let newest = events[0]
  let completedCount = 0
  let transferredBytes = 0
  let sumOfKnownTotals = 0

  for (const event of events) {
    if (event.updatedAt > newest.updatedAt) newest = event
    sumOfKnownTotals += event.totalBytes

    switch (event.state) {
      case 'failed':
        failed ??= event
        break
      case 'paused':
        paused ??= event
        transferredBytes += event.bytesTransferred
        break
      case 'started':
      case 'progress':
        inFlight ??= event
        transferredBytes += event.bytesTransferred
        break
      case 'completed':
        completedCount += 1
        transferredBytes += event.totalBytes
        break
    }
  }

  return { failed, paused, inFlight, newest, completedCount, transferredBytes, sumOfKnownTotals }
}

export function derivePeerStatus(
  isConnected: boolean,
  events: PeerDownloadEvent[],
  expectedFileCount: number,
  expectedTotalBytes: number
): PeerStatusData {
  const summary = summarizeEvents(events)
  if (!summary) {
    return {
      status: isConnected ? 'online' : 'disconnected',
      completedCount: 0,
      sortKey: isConnected ? 0 : -1
    }
  }

  const { failed, paused, inFlight, newest, completedCount, transferredBytes, sumOfKnownTotals } =
    summary

  if (failed) {
    return {
      status: 'failed',
      completedCount,
      failedFileName: failed.fileName,
      sortKey: failed.updatedAt
    }
  }

  if (expectedFileCount > 0 && completedCount >= expectedFileCount) {
    return { status: 'downloaded', completedCount, sortKey: newest.updatedAt }
  }

  if (!isConnected) {
    return { status: 'disconnected', completedCount, sortKey: newest.updatedAt }
  }

  if (paused && !inFlight) {
    return {
      status: 'paused',
      completedCount,
      transferredBytes,
      totalForDisplay: sumOfKnownTotals || expectedTotalBytes,
      sortKey: paused.updatedAt
    }
  }

  if (inFlight) {
    const totalForDisplay = expectedTotalBytes > 0 ? expectedTotalBytes : sumOfKnownTotals
    const progressPercent =
      totalForDisplay > 0 ? toProgressPercent(transferredBytes, totalForDisplay) : undefined
    return {
      status: 'downloading',
      completedCount,
      progressPercent,
      transferredBytes: totalForDisplay > 0 ? transferredBytes : undefined,
      totalForDisplay: totalForDisplay > 0 ? totalForDisplay : undefined,
      inFlightFileName: inFlight.fileName,
      sortKey: inFlight.updatedAt
    }
  }

  return { status: 'online', completedCount, sortKey: newest.updatedAt }
}
