import type { ConnectedPeer, PeerDownloadEvent, PeerListStatus, PeerStatusData } from './shareModel'
import { derivePeerStatus } from './shareModel'

export type PeerListEntryDetail =
  | { type: 'failed-file'; fileName: string }
  | { type: 'completed-files'; count: number }
  | { type: 'completed-done'; count: number }
  | { type: 'progress-bytes'; transferredBytes: number; totalBytes: number }
  | { type: 'in-flight-file'; fileName: string }

export interface PeerListEntry {
  peerKey: string
  shortKey: string
  status: PeerListStatus
  isConnected: boolean
  detail: PeerListEntryDetail | null
  progressPercent?: number
  sortKey: number
}

export type PairState = 'pairable' | 'requested' | 'paired'

export interface PeerListEntryWithPair extends PeerListEntry {
  pairState?: PairState
  displayName?: string
}

export function applyPairState(
  entries: PeerListEntry[],
  pairStatus: Record<string, PairState>,
  peerDisplayNames: Record<string, string> = {}
): PeerListEntryWithPair[] {
  return entries.map((entry) => {
    let pairState: PairState | undefined
    if (entry.isConnected) {
      pairState = pairStatus[entry.peerKey] ?? 'pairable'
    }
    const displayName = pairState === 'paired' ? peerDisplayNames[entry.peerKey] : undefined
    return { ...entry, pairState, displayName }
  })
}

function getStatusDetail(data: PeerStatusData): PeerListEntryDetail | null {
  switch (data.status) {
    case 'failed':
      return data.failedFileName ? { type: 'failed-file', fileName: data.failedFileName } : null
    case 'downloaded':
      return { type: 'completed-files', count: data.completedCount }
    case 'disconnected':
    case 'online':
      return data.completedCount > 0 ? { type: 'completed-done', count: data.completedCount } : null
    case 'downloading':
      if (data.transferredBytes != null && data.totalForDisplay != null) {
        return {
          type: 'progress-bytes',
          transferredBytes: data.transferredBytes,
          totalBytes: data.totalForDisplay
        }
      }
      return data.inFlightFileName
        ? { type: 'in-flight-file', fileName: data.inFlightFileName }
        : null
  }
}

export function getPeerListEntries(
  connectedPeers: Record<string, ConnectedPeer>,
  peerDownloads: Record<string, PeerDownloadEvent>,
  offers: ReadonlyArray<{ readonly size?: number }>
): PeerListEntry[] {
  const byPeer = new Map<string, PeerDownloadEvent[]>()
  for (const event of Object.values(peerDownloads)) {
    const list = byPeer.get(event.peerKey) ?? []
    list.push(event)
    byPeer.set(event.peerKey, list)
  }

  const expectedFileCount = offers.length
  const expectedTotalBytes = offers.reduce((sum, offer) => sum + (offer.size ?? 0), 0)

  const peerKeys = new Set<string>([...Object.keys(connectedPeers), ...byPeer.keys()])

  const entries: PeerListEntry[] = []
  for (const peerKey of peerKeys) {
    const tracked = connectedPeers[peerKey]
    const isConnected = Boolean(tracked && !tracked.disconnectedAt)
    const events = byPeer.get(peerKey) ?? []
    const data = derivePeerStatus(isConnected, events, expectedFileCount, expectedTotalBytes)
    entries.push({
      peerKey,
      shortKey: peerKey.slice(0, 6),
      status: data.status,
      isConnected,
      detail: getStatusDetail(data),
      progressPercent: data.progressPercent,
      sortKey: data.sortKey || tracked?.connectedAt || 0
    })
  }

  return entries.sort((a, b) => b.sortKey - a.sortKey)
}
