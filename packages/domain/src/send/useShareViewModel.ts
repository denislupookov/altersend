import { useEffect, useMemo, useRef, useState } from 'react'
import type { RememberedPeer } from '@altersend/core'
import { formatFileSize, formatRelativeTime, type InviteStatus } from '../format'
import { forgetPeer, inviteDevice, requestPair, startSendSession } from '../transfer/commands'
import { useTransferStore } from '../transfer/store'
import { applyPairState, getPeerListEntries } from './peerListUi'
import type { PairState, PeerListEntryWithPair } from './peerListUi'
import type { Translate } from '../i18n'

const PEER_JOIN_TOAST_DELAY_MS = 600

export type SubtitleTone = 'muted' | 'success' | 'danger' | 'info'

interface InviteStatusState {
  status: InviteStatus
  topic?: string
  invitedAt: number
}

export interface ConnectedDeviceRow {
  kind: 'connected'
  peerKey: string
  name: string
  isKnown: boolean
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
  forget: (peerKey: string) => Promise<boolean>
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
    return {
      subtitle: `${t('common:files.count', { count: fileCount })} downloaded`,
      subtitleTone: 'success'
    }
  }
  if (entry.status === 'online') {
    return { subtitle: `● ${t('send:status.online')}`, subtitleTone: 'info' }
  }
  if (entry.status === 'failed') {
    return {
      subtitle: detailLabel(entry.detail, t) ?? statusLabel('failed', t),
      subtitleTone: 'danger'
    }
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

export interface ShareViewModelCallbacks {
  onPeerJoined?: (peer: ConnectedDeviceRow) => void
  onPeerPaired?: (peer: ConnectedDeviceRow) => void
  onInviteFailed?: (peer: OfflineDeviceRow) => void
}

export function useShareViewModel(
  t: Translate,
  callbacks: ShareViewModelCallbacks = {}
): ShareViewModel {
  const selectedFiles = useTransferStore((s) => s.selectedFiles)
  const connectionState = useTransferStore((s) => s.connectionState)
  const topic = useTransferStore((s) => s.topic) ?? ''
  const peerDownloads = useTransferStore((s) => s.peerDownloads)
  const connectedPeers = useTransferStore((s) => s.connectedPeers)
  const transferId = useTransferStore((s) => s.transferId)
  const pairStatus = useTransferStore((s) => s.remember.pairStatus)
  const peerDisplayNames = useTransferStore((s) => s.remember.peerDisplayNames)
  const inviteResponses = useTransferStore((s) => s.remember.inviteResponses)
  const rememberedPeers = useTransferStore((s) => s.peers)

  const [isCopied, setIsCopied] = useState(false)
  const [inviteStatuses, setInviteStatuses] = useState<Record<string, InviteStatusState>>({})

  useEffect(() => {
    if (!isCopied) return
    const id = setTimeout(() => setIsCopied(false), 2000)
    return () => clearTimeout(id)
  }, [isCopied])

  useEffect(() => {
    setInviteStatuses((current) => {
      let changed = false
      const next = { ...current }
      for (const response of Object.values(inviteResponses)) {
        if (response.response !== 'declined') continue
        const inviteState = next[response.remoteDevicePubkey]
        if (!inviteState || inviteState.status !== 'sent') continue
        if (inviteState.topic && inviteState.topic !== response.topic) continue
        if (response.receivedAt < inviteState.invitedAt) continue
        delete next[response.remoteDevicePubkey]
        changed = true
      }
      return changed ? next : current
    })
  }, [inviteResponses, inviteStatuses])

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
            !connectedKeySet.has(p.remoteDevicePubkey) && !connectedDisplayNames.has(p.displayName)
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
      isKnown: Boolean(entry.displayName ?? peerDisplayNames[entry.peerKey]),
      deviceType: rememberedForPeer?.deviceType ?? null,
      subtitle,
      subtitleTone,
      progressPercent: entry.status === 'downloading' ? entry.progressPercent : undefined,
      action: entry.status === 'disconnected' ? 'pair-done' : toPairAction(entry.pairState)
    }
  })

  const offlineRows: OfflineDeviceRow[] = offlineRemembered.map((peer: RememberedPeer) => {
    const st = inviteStatuses[peer.remoteDevicePubkey]?.status
    const subtitleStr =
      st === 'offline' ? t('send:peer.deviceOffline') : formatRelativeTime(peer.lastSeenAt)
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

  const callbacksRef = useRef(callbacks)
  callbacksRef.current = callbacks
  const connectedRowsRef = useRef<ConnectedDeviceRow[]>([])
  connectedRowsRef.current = connectedRows
  const connectedPeerKeysRef = useRef<Set<string> | null>(null)
  const prevPairActionsRef = useRef<Map<string, ConnectedDeviceRow['action']>>(new Map())
  const joinTimersRef = useRef<ReturnType<typeof setTimeout>[]>([])
  useEffect(() => () => joinTimersRef.current.forEach(clearTimeout), [])
  useEffect(() => {
    const currentKeys = new Set(connectedRows.map((row) => row.peerKey))
    const previousKeys = connectedPeerKeysRef.current
    connectedPeerKeysRef.current = currentKeys
    if (previousKeys) {
      const joined = connectedRows.find((row) => !previousKeys.has(row.peerKey))
      if (joined) {
        const peerKey = joined.peerKey
        joinTimersRef.current.push(
          setTimeout(() => {
            const row = connectedRowsRef.current.find((r) => r.peerKey === peerKey)
            if (row) callbacksRef.current.onPeerJoined?.(row)
          }, PEER_JOIN_TOAST_DELAY_MS)
        )
      }
    }
    for (const row of connectedRows) {
      const prevAction = prevPairActionsRef.current.get(row.peerKey)
      if (prevAction === 'pair-requested' && row.action === 'pair-done') {
        callbacksRef.current.onPeerPaired?.(row)
      }
    }
    prevPairActionsRef.current = new Map(connectedRows.map((row) => [row.peerKey, row.action]))
  }, [connectedRows])

  const pair = (peerKey: string) => {
    if (transferId) requestPair(transferId, peerKey)
  }

  const invite = async (peerKey: string) => {
    if (inviteStatuses[peerKey]?.status === 'inviting') return
    const peer = offlineRows.find((row) => row.peerKey === peerKey)
    const invitedAt = Date.now()
    setInviteStatuses((s) => ({ ...s, [peerKey]: { status: 'inviting', invitedAt } }))
    try {
      const sessionTopic = await startSendSession()
      const delivered = await inviteDevice(peerKey, sessionTopic, {
        fileCount: selectedFiles.length,
        totalSize: selectedFiles.reduce((sum, file) => sum + (file.size ?? 0), 0)
      })
      setInviteStatuses((s) => ({
        ...s,
        [peerKey]: { status: delivered ? 'sent' : 'offline', topic: sessionTopic, invitedAt }
      }))
      if (!delivered && peer) callbacksRef.current.onInviteFailed?.(peer)
    } catch {
      setInviteStatuses((s) => ({ ...s, [peerKey]: { status: 'offline', invitedAt } }))
      if (peer) callbacksRef.current.onInviteFailed?.(peer)
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
    invite,
    forget: forgetPeer
  }
}
