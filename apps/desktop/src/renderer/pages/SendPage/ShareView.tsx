import { useEffect, useMemo, useState } from 'react'
import type { PeerListCardEntry } from '@altersend/components'
import {
  applyPairState,
  formatFileSize,
  getPeerListEntries,
  type PeerListEntry,
  type PeerListEntryDetail,
  type PeerListEntryWithPair,
  requestPair,
  useTransferStore
} from '@altersend/domain'
import { Button, Disclosure, PeerListCard, SendFileListRow } from '@altersend/components'
import { AlertCircleIcon, FolderIcon, SmartphoneIcon } from '@altersend/components/icons'
import { useTranslation } from '@altersend/locales'
import { QRModal } from '../../components/QRModal'
import { AddDeviceModal } from '../../components/AddDeviceModal'
import { ConnectionCard } from './ConnectionCard'

function getPeerStatusLabel(t: ReturnType<typeof useTranslation>['t'], entry: PeerListEntry) {
  switch (entry.status) {
    case 'failed':
      return t('send:status.failed')
    case 'downloaded':
      return t('send:status.downloaded')
    case 'disconnected':
      return t('send:status.disconnected')
    case 'online':
      return t('send:status.online')
    case 'downloading':
      return entry.progressPercent != null
        ? t('send:status.downloadingPercent', { percent: entry.progressPercent })
        : t('send:status.downloading')
  }
}

function getPeerDetailLabel(
  t: ReturnType<typeof useTranslation>['t'],
  detail: PeerListEntryDetail | null
) {
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

function toPeerListCardEntry(
  t: ReturnType<typeof useTranslation>['t'],
  entry: PeerListEntryWithPair
): PeerListCardEntry {
  return {
    ...entry,
    shortKey: entry.displayName ?? entry.shortKey,
    statusLabel: getPeerStatusLabel(t, entry),
    detail: getPeerDetailLabel(t, entry.detail),
    pairState: entry.pairState
  }
}

export function ShareView() {
  const { t } = useTranslation(['send', 'common'])
  const selectedFiles = useTransferStore((s) => s.selectedFiles)
  const connectionState = useTransferStore((s) => s.connectionState)
  const topic = useTransferStore((s) => s.topic)
  const peerDownloads = useTransferStore((s) => s.peerDownloads)
  const connectedPeers = useTransferStore((s) => s.connectedPeers)
  const transferId = useTransferStore((s) => s.transferId)
  const pairStatus = useTransferStore((s) => s.remember.pairStatus)
  const peerDisplayNames = useTransferStore((s) => s.remember.peerDisplayNames)
  const isPeerConnected = connectionState === 'peer-connected'
  const [isKeyCopied, setIsKeyCopied] = useState(false)
  const [isFilesExpanded, setIsFilesExpanded] = useState(false)
  const [isQRModalOpen, setIsQRModalOpen] = useState(false)
  const [isAddDeviceOpen, setIsAddDeviceOpen] = useState(false)

  const totalSize = selectedFiles.reduce((sum, file) => sum + (file.size ?? 0), 0)
  const peerEntries = useMemo(
    () => getPeerListEntries(connectedPeers, peerDownloads, selectedFiles),
    [connectedPeers, peerDownloads, selectedFiles]
  )
  const hasActivity = isPeerConnected || peerEntries.length > 0
  const deviceEntries = useMemo(
    () => applyPairState(peerEntries, pairStatus, peerDisplayNames).map((e) => toPeerListCardEntry(t, e)),
    [peerEntries, pairStatus, peerDisplayNames, t]
  )

  useEffect(() => {
    if (!isKeyCopied) return
    const timer = window.setTimeout(() => setIsKeyCopied(false), 2000)
    return () => window.clearTimeout(timer)
  }, [isKeyCopied])

  const copyTopic = async () => {
    if (!topic) return
    await navigator.clipboard.writeText(topic)
    setIsKeyCopied(true)
  }

  const handlePair = (peerKey: string) => {
    if (transferId) requestPair(transferId, peerKey)
  }

  return (
    <div className='flex flex-col gap-3'>
      <aside aria-live='polite' className='flex items-center gap-2 px-1 text-text-muted'>
        <AlertCircleIcon size={12} />
        <span className='text-[11.5px] leading-[1.4]'>{t('send:hints.keepOpen')}</span>
      </aside>

      <Button
        icon={<SmartphoneIcon size={16} />}
        onClick={() => setIsAddDeviceOpen(true)}
        variant='secondary'
        width='full'
      >
        Add a device
      </Button>

      <ConnectionCard
        topic={topic}
        hasActivity={hasActivity}
        isKeyCopied={isKeyCopied}
        onCopy={() => void copyTopic()}
        onOpenQR={() => setIsQRModalOpen(true)}
      />

      <PeerListCard entries={deviceEntries} label='Devices' onPair={handlePair} />

      <Disclosure
        compact
        expanded={isFilesExpanded}
        icon={<FolderIcon size={16} />}
        onToggle={() => setIsFilesExpanded((v) => !v)}
        subtitle={formatFileSize(totalSize)}
        title={t('common:files.count', { count: selectedFiles.length })}
      >
        {selectedFiles.map((file) => (
          <SendFileListRow key={file.path} bare compact name={file.name} size={file.size} />
        ))}
      </Disclosure>

      <QRModal topic={topic} open={isQRModalOpen} onClose={() => setIsQRModalOpen(false)} />
      <AddDeviceModal open={isAddDeviceOpen} onClose={() => setIsAddDeviceOpen(false)} topic={topic || undefined} />
    </div>
  )
}
