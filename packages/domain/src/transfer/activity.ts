import { getDownloadTotals, isAutoResumable } from '../receive/downloadModel'
import { summarizeEvents, type PeerDownloadEvent } from '../send/shareModel'
import type { SenderUploadItem } from '../send/draftTypes'
import { toProgressPercent } from './rate'
import type { TransferRole, TransferSessionState } from './types'

export type TransferPhase = 'preparing' | 'waiting' | 'transferring'

export interface TransferActivity {
  active: boolean
  settled: boolean
  role: TransferRole | null
  phase: TransferPhase
  deviceCount: number
  receivedPeers: string[]
  percent: number
  bytesTransferred: number
  totalBytes: number
}

const IDLE: TransferActivity = {
  active: false,
  settled: true,
  role: null,
  phase: 'transferring',
  deviceCount: 0,
  receivedPeers: [],
  percent: 0,
  bytesTransferred: 0,
  totalBytes: 0
}

function getPreparingActivity(items: SenderUploadItem[]): TransferActivity {
  const completed = items.filter((item) => item.status === 'completed').length
  return {
    active: countSharedFiles(items) > 0,
    settled: false,
    role: 'sender',
    phase: 'preparing',
    deviceCount: 0,
    receivedPeers: [],
    percent: items.length > 0 ? Math.round((completed / items.length) * 100) : 0,
    bytesTransferred: 0,
    totalBytes: 0
  }
}

export function countSharedFiles(items: SenderUploadItem[]): number {
  return items.filter((item) => item.kind !== 'text').length
}

function countConnectedPeers(state: TransferSessionState): number {
  return Object.values(state.connectedPeers).filter((peer) => peer.disconnectedAt === undefined)
    .length
}

function getReceivedPeers(events: PeerDownloadEvent[], expectedFiles: number): string[] {
  if (expectedFiles === 0) return []

  const completed = new Map<string, Set<string>>()
  for (const event of events) {
    if (event.state !== 'completed') continue
    const ids = completed.get(event.peerKey) ?? new Set<string>()
    ids.add(event.id)
    completed.set(event.peerKey, ids)
  }

  return [...completed.entries()]
    .filter(([, ids]) => ids.size >= expectedFiles)
    .map(([peerKey]) => peerKey)
}

function getSenderActivity(state: TransferSessionState): TransferActivity {
  const deviceCount = countConnectedPeers(state)
  const events = Object.values(state.peerDownloads)
  const expectedFiles = countSharedFiles(state.uploadItems)
  const receivedPeers = getReceivedPeers(events, expectedFiles)

  const received = new Set(receivedPeers)
  const busyPeers = new Set<string>()
  for (const event of events) {
    if (event.state === 'failed' || received.has(event.peerKey)) continue

    const doneWithUnknownTotal = event.state === 'completed' && expectedFiles === 0
    if (doneWithUnknownTotal) continue

    busyPeers.add(event.peerKey)
  }
  const summary = summarizeEvents(events.filter((event) => busyPeers.has(event.peerKey)))

  if (!summary) {
    return {
      active: state.draftPhase === 'ready' && expectedFiles > 0,
      settled: false,
      role: 'sender',
      phase: 'waiting',
      deviceCount,
      receivedPeers,
      percent: 0,
      bytesTransferred: 0,
      totalBytes: 0
    }
  }

  const shareBytes = state.uploadItems.reduce((sum, item) => sum + (item.size ?? 0), 0)
  const totalBytes = Math.max(shareBytes * busyPeers.size, summary.sumOfKnownTotals)

  return {
    active: true,
    settled: false,
    role: 'sender',
    phase: 'transferring',
    deviceCount,
    receivedPeers,
    percent: toProgressPercent(summary.transferredBytes, totalBytes),
    bytesTransferred: summary.transferredBytes,
    totalBytes
  }
}

function getReceiverActivity(state: TransferSessionState): TransferActivity {
  const totals = getDownloadTotals(state.incomingFileOffers, state.receiveDownloadStates)
  let queued = false
  let failed = false
  let routing = false
  let retrying = false

  for (const item of Object.values(state.receiveDownloadStates)) {
    if (item.queued === true) queued = true
    if (item.status === 'failed') failed = true
    if (item.status === 'completed' && item.destination === undefined) routing = true
    if (state.peerCount > 0 && isAutoResumable(item)) retrying = true
  }

  return {
    active: totals.activeCount > 0 || queued || routing || retrying,
    settled: !failed,
    role: 'receiver',
    phase: 'transferring',
    deviceCount: state.peerCount,
    receivedPeers: [],
    percent: totals.percent,
    bytesTransferred: totals.bytesTransferred,
    totalBytes: totals.totalBytes
  }
}

export function getTransferActivity(state: TransferSessionState): TransferActivity {
  if (state.draftPhase === 'preparing') return getPreparingActivity(state.uploadItems)
  if (state.role === 'receiver') return getReceiverActivity(state)
  if (state.role === 'sender') return getSenderActivity(state)

  return IDLE
}
