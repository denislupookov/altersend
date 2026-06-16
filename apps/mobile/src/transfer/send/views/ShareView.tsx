import { useEffect, useMemo, useState } from 'react'
import { ScrollView, Share, StyleSheet, View } from 'react-native'
import * as Clipboard from 'expo-clipboard'
import type { PeerListCardEntry } from '@altersend/components'
import {
  applyPairState,
  buildInviteText,
  formatFileSize,
  getPeerListEntries,
  type PeerListEntry,
  type PeerListEntryDetail,
  requestPair,
  useTransferStore
} from '@altersend/domain'
import { Button, Disclosure, PeerListCard, SendFileListRow, useTheme } from '@altersend/components'
import { AlertCircleIcon, FolderIcon, SmartphoneIcon } from '@altersend/components/icons'
import { useTranslation } from '@altersend/locales'
import { useToast } from '@/src/components/Toast'
import { QRSection } from './QRSection'
import { Text } from '@/src/components/ThemedText'
import { AddDeviceSheet } from './AddDeviceSheet'

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
  entry: PeerListEntry
): PeerListCardEntry {
  return {
    ...entry,
    statusLabel: getPeerStatusLabel(t, entry),
    detail: getPeerDetailLabel(t, entry.detail)
  }
}

export function ShareView() {
  const { t } = useTranslation(['send', 'common'])
  const { theme } = useTheme()
  const selectedFiles = useTransferStore((s) => s.selectedFiles)
  const topicRaw = useTransferStore((s) => s.topic)
  const connectionState = useTransferStore((s) => s.connectionState)
  const peerDownloads = useTransferStore((s) => s.peerDownloads)
  const connectedPeers = useTransferStore((s) => s.connectedPeers)
  const transferId = useTransferStore((s) => s.transferId)
  const pairStatus = useTransferStore((s) => s.remember.pairStatus)
  const topic = topicRaw ?? ''
  const isPeerConnected = connectionState === 'peer-connected'
  const [isFilesExpanded, setIsFilesExpanded] = useState(false)
  const [isKeyCopied, setIsKeyCopied] = useState(false)
  const [isAddDeviceOpen, setIsAddDeviceOpen] = useState(false)
  const toast = useToast()

  const totalSize = selectedFiles.reduce((sum, file) => sum + (file.size ?? 0), 0)
  const peerEntries = useMemo(
    () => getPeerListEntries(connectedPeers, peerDownloads, selectedFiles),
    [connectedPeers, peerDownloads, selectedFiles]
  )
  const hasActivity = isPeerConnected || peerEntries.length > 0
  const showWaitingState = !hasActivity
  const deviceEntries = useMemo(
    () => applyPairState(peerEntries, pairStatus).map((e) => toPeerListCardEntry(t, e)),
    [peerEntries, pairStatus, t]
  )

  const handlePair = (peerKey: string) => {
    if (transferId) requestPair(transferId, peerKey)
  }

  const onCopy = async () => {
    if (!topic) return
    try {
      await Clipboard.setStringAsync(topic)
      setIsKeyCopied(true)
      toast.show({ title: t('send:connection.copiedToast') })
      await Share.share({ message: buildInviteText(topic) })
    } catch (error) {
      console.error(error)
    }
  }

  useEffect(() => {
    if (!isKeyCopied) return
    const id = setTimeout(() => setIsKeyCopied(false), 2000)
    return () => clearTimeout(id)
  }, [isKeyCopied])

  return (
    <>
      <ScrollView style={styles.container}>
        <View style={styles.hint}>
          <AlertCircleIcon size={12} />
          <Text style={[styles.hintText, { color: theme.colors.colorTextMuted }]}>
            {t('send:hints.keepOpen')}
          </Text>
        </View>

        <View style={styles.addDeviceWrap}>
          <Button
            icon={<SmartphoneIcon size={16} />}
            onClick={() => setIsAddDeviceOpen(true)}
            variant='secondary'
            width='full'
          >
            Add a device
          </Button>
        </View>

        <QRSection
          topic={topic}
          isKeyCopied={isKeyCopied}
          onCopy={() => void onCopy()}
          showWaitingState={showWaitingState}
        />

        {peerEntries.length > 0 ? (
          <View style={styles.peerListWrap}>
            <PeerListCard entries={deviceEntries} onPair={handlePair} />
          </View>
        ) : null}

        <Disclosure
          expanded={isFilesExpanded}
          icon={<FolderIcon size={20} />}
          onToggle={() => setIsFilesExpanded(!isFilesExpanded)}
          subtitle={formatFileSize(totalSize)}
          title={selectedFiles.length === 1 ? '1 file' : `${selectedFiles.length} files`}
        >
          {selectedFiles.map((file) => (
            <SendFileListRow key={file.path} bare name={file.name} size={file.size} />
          ))}
        </Disclosure>
      </ScrollView>

      <AddDeviceSheet open={isAddDeviceOpen} onClose={() => setIsAddDeviceOpen(false)} />
    </>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1
  },
  hint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 4,
    marginBottom: 10
  },
  hintText: {
    fontSize: 11.5,
    lineHeight: 16,
    flexShrink: 1
  },
  addDeviceWrap: {
    marginBottom: 12
  },
  peerListWrap: {
    marginBottom: 16
  }
})
