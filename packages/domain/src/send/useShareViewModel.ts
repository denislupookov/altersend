import { useEffect, useMemo, useState } from 'react'
import type { RememberedPeer } from '@altersend/core'
import { formatFileSize, formatRelativeTime, type InviteStatus, inviteStatusSubtitle } from '../format'
import { inviteDevice, requestPair, startSendSession } from '../transfer/commands'
import { useTransferStore } from '../transfer/store'
import { applyPairState, getPeerListEntries } from './peerListUi'
import type { PairState, PeerListEntryWithPair } from './peerListUi'
import type { Translate } from '../i18n'

export type SubtitleTone = 'muted' | 'success' | 'danger' | 'info'

export interface ConnectedDeviceRow {
  kind: 'connected'
  peerKey: string
  name: string
  deviceType: string | null
  subtitle: string
  subtitleTone: SubtitleTone
  progressPercent?: number
  action: 'pair' | 'pair-requested' | 'pair-done'
}

export interface OfflineDeviceRow {
  kind: 'offline'
  peerKey: string
  name: string
  deviceType: string
  subtitle: string
  subtitleTone: SubtitleTone
  action: 'invite' | 'inviting' | 'invite-sent' | 'invite-offline'
}

export type DeviceRow = ConnectedDeviceRow | OfflineDeviceRow

export interface FileRow {
  path: string
  name: string
  size?: number
}

export interface ShareViewModel {
  phase: 'waiting' | 'connected'
  topic: string

  files: FileRow[]
  totalSize: number

  devices: DeviceRow[]
  connectedCount: number
  hasDevices: boolean

  isCopied: boolean
  markCopied: () => void

  pair: (peerKey: string) => void
  invite: (peerKey: string) => Promise<void>
}

function statusLabel(status: PeerListEntryWithPair['status'], t: Translate): string {
  switch (status) {
    case 'failed':
      return t('send:status.failed')
    case 'downloaded':
      return t('send:status.downloaded')
    case 'disconnected':
      return t('send:status.disconnected')
    case 'online':
      return t('send:status.online')
    case 'downloading':
      return t('send:status.downloading')
  }
}

function detailLabel(detail: PeerListEntryWithPair['detail'], t: Translate): string | null {
  if (!detail) return null
  switch (detail.type) {
    case 'failed-file':
    case 'in-flight-file':
      return detail.fileName
    case 'completed-files':
      return t('common:files.count', { count: detail.count })
    case 'completed-done':
      return t('send:peer.completedDone', { count: detail.count })
    case 'progress-bytes':
      return `${formatFileSize(detail.transferredBytes)} / ${formatFileSize(detail.totalBytes)}`
  }
}

function connectedDeviceSubtitle(
  entry: PeerListEntryWithPair,
  fileCount: number,
  t: Translate
): { subtitle: string; subtitleTone: SubtitleTone } {
  if (entry.status === 'downloaded') {
    return { subtitle: `${t('common:files.count', { count: fileCount })} downloaded`, subtitleTone: 'success' }
  }
  if (entry.status === 'online') {
    return { subtitle: `● ${t('send:status.online')}`, subtitleTone: 'info' }
  }
  if (entry.status === 'failed') {
    return { subtitle: detailLabel(entry.detail, t) ?? statusLabel('failed', t), subtitleTone: 'danger' }
  }
  return {
    subtitle: detailLabel(entry.detail, t) ?? statusLabel(entry.status, t),
    subtitleTone: 'muted'
  }
}

function toPairAction(pairState: PairState | undefined): ConnectedDeviceRow['action'] {
  if (pairState === 'requested') return 'pair-requested'
  if (pairState === 'paired') return 'pair-done'
  return 'pair'
}

function toInviteAction(st: InviteStatus | undefined): OfflineDeviceRow['action'] {
  if (st === 'inviting') return 'inviting'
  if (st === 'sent') return 'invite-sent'
  if (st === 'offline') return 'invite-offline'
  return 'invite'
}

export function useShareViewModel(t: Translate): ShareViewModel {
  const selectedFiles = useTransferStore((s) => s.selectedFiles)
  const connectionState = useTransferStore((s) => s.connectionState)
  const topic = useTransferStore((s) => s.topic) ?? ''
  const peerDownloads = useTransferStore((s) => s.peerDownloads)
  const connectedPeers = useTransferStore((s) => s.connectedPeers)
  const transferId = useTransferStore((s) => s.transferId)
  const pairStatus = useTransferStore((s) => s.remember.pairStatus)
  const peerDisplayNames = useTransferStore((s) => s.remember.peerDisplayNames)
  const rememberedPeers = useTransferStore((s) => s.peers)

  const [isCopied, setIsCopied] = useState(false)
  const [inviteStatuses, setInviteStatuses] = useState<Record<string, InviteStatus>>({})

  useEffect(() => {
    if (!isCopied) return
    const id = setTimeout(() => setIsCopied(false), 2000)
    return () => clearTimeout(id)
  }, [isCopied])

  const connectedPeerList = useMemo(() => Object.values(connectedPeers), [connectedPeers])

  const connectedKeySet = useMemo(
    () => new Set(connectedPeerList.map((p) => p.peerKey)),
    [connectedPeerList]
  )

  const connectedDisplayNames = useMemo(
    () =>
      new Set(
        connectedPeerList.map((p) => peerDisplayNames[p.peerKey]).filter(Boolean) as string[]
      ),
    [connectedPeerList, peerDisplayNames]
  )

  const peerEntries = useMemo(
    () => getPeerListEntries(connectedPeers, peerDownloads, selectedFiles),
    [connectedPeers, peerDownloads, selectedFiles]
  )
  const peerEntriesWithPair = useMemo(
    () => applyPairState(peerEntries, pairStatus, peerDisplayNames),
    [peerEntries, pairStatus, peerDisplayNames]
  )

  const offlineRemembered = useMemo(
    () =>
      rememberedPeers
        .filter(
          (p: RememberedPeer) =>
            !connectedKeySet.has(p.remoteDevicePubkey) &&
            !connectedDisplayNames.has(p.displayName)
        )
        .sort((a: RememberedPeer, b: RememberedPeer) => b.lastSeenAt - a.lastSeenAt),
    [rememberedPeers, connectedKeySet, connectedDisplayNames]
  )

  const connectedRows: ConnectedDeviceRow[] = peerEntriesWithPair.map((entry) => {
    const { subtitle, subtitleTone } = connectedDeviceSubtitle(entry, selectedFiles.length, t)
    const rememberedForPeer = rememberedPeers.find(
      (r: RememberedPeer) =>
        r.remoteDevicePubkey === entry.peerKey ||
        (peerDisplayNames[entry.peerKey] && r.displayName === peerDisplayNames[entry.peerKey])
    )
    return {
      kind: 'connected',
      peerKey: entry.peerKey,
      name: entry.displayName ?? peerDisplayNames[entry.peerKey] ?? entry.shortKey,
      deviceType: rememberedForPeer?.deviceType ?? null,
      subtitle,
      subtitleTone,
      progressPercent: entry.status === 'downloading' ? entry.progressPercent : undefined,
      action: toPairAction(entry.pairState)
    }
  })

  const offlineRows: OfflineDeviceRow[] = offlineRemembered.map((peer: RememberedPeer) => {
    const st = inviteStatuses[peer.remoteDevicePubkey]
    const subtitleStr =
      st === 'offline' ? (inviteStatusSubtitle(st) ?? 'Unreachable') : formatRelativeTime(peer.lastSeenAt)
    return {
      kind: 'offline',
      peerKey: peer.remoteDevicePubkey,
      name: peer.displayName,
      deviceType: peer.deviceType,
      subtitle: subtitleStr,
      subtitleTone: st === 'offline' ? 'danger' : 'muted',
      action: toInviteAction(st)
    }
  })

  const devices: DeviceRow[] = [...connectedRows, ...offlineRows]

  const pair = (peerKey: string) => {
    if (transferId) requestPair(transferId, peerKey)
  }

  const invite = async (peerKey: string) => {
    if (inviteStatuses[peerKey] === 'inviting') return
    setInviteStatuses((s) => ({ ...s, [peerKey]: 'inviting' }))
    try {
      const sessionTopic = await startSendSession()
      const delivered = await inviteDevice(peerKey, sessionTopic)
      setInviteStatuses((s) => ({ ...s, [peerKey]: delivered ? 'sent' : 'offline' }))
    } catch {
      setInviteStatuses((s) => ({ ...s, [peerKey]: 'offline' }))
    }
  }

  return {
    phase: connectionState === 'peer-connected' ? 'connected' : 'waiting',
    topic,
    files: selectedFiles.map((f) => ({ path: f.path, name: f.name, size: f.size })),
    totalSize: selectedFiles.reduce((sum, f) => sum + (f.size ?? 0), 0),
    devices,
    connectedCount: connectedRows.length,
    hasDevices: devices.length > 0,
    isCopied,
    markCopied: () => setIsCopied(true),
    pair,
    invite
  }
}
