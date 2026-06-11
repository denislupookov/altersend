import { useEffect, useMemo, useState } from 'react'
import { ScrollView, Share, StyleSheet, View } from 'react-native'
import * as Clipboard from 'expo-clipboard'
import type { PeerListCardEntry } from '@altersend/components'
import {
  buildInviteText,
  formatFileSize,
  getPeerListEntries,
  type PeerListEntry,
  type PeerListEntryDetail,
  useTransferStore
} from '@altersend/domain'
import { Disclosure, PeerListCard, SendFileListRow, useTheme } from '@altersend/components'
import { AlertCircleIcon, FolderIcon } from '@altersend/components/icons'
import { useTranslation } from '@altersend/locales'
import { useToast } from '@/src/components/Toast'
import { QRSection } from './QRSection'
import { Text } from '@/src/components/ThemedText'

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
  const topic = topicRaw ?? ''
  const isPeerConnected = connectionState === 'peer-connected'
  const [isFilesExpanded, setIsFilesExpanded] = useState(false)
  const [isKeyCopied, setIsKeyCopied] = useState(false)
  const toast = useToast()

  const totalSize = selectedFiles.reduce((sum, file) => sum + (file.size ?? 0), 0)
  const peerEntries = useMemo(
    () => getPeerListEntries(connectedPeers, peerDownloads, selectedFiles),
    [connectedPeers, peerDownloads, selectedFiles]
  )
  const peerCardEntries = peerEntries.map((entry) => toPeerListCardEntry(t, entry))
  const hasActivity = isPeerConnected || peerEntries.length > 0
  const showWaitingState = !hasActivity

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
    <ScrollView style={styles.container}>
      <View style={styles.hint}>
        <AlertCircleIcon size={12} />
        <Text style={[styles.hintText, { color: theme.colors.colorTextMuted }]}>
          {t('send:hints.keepOpen')}
        </Text>
      </View>

      <QRSection
        topic={topic}
        isKeyCopied={isKeyCopied}
        onCopy={() => void onCopy()}
        showWaitingState={showWaitingState}
      />

      {peerEntries.length > 0 ? (
        <View style={styles.peerListWrap}>
          <PeerListCard
            entries={peerCardEntries}
            labels={{
              title: t('send:peer.devices'),
              connectedCount: (count) => t('send:peer.connectedCount', { count })
            }}
          />
        </View>
      ) : null}

      <Disclosure
        expanded={isFilesExpanded}
        icon={<FolderIcon size={20} />}
        onToggle={() => setIsFilesExpanded(!isFilesExpanded)}
        subtitle={formatFileSize(totalSize)}
        title={t('common:files.count', { count: selectedFiles.length })}
      >
        {selectedFiles.map((file) => (
          <SendFileListRow key={file.path} bare name={file.name} size={file.size} />
        ))}
      </Disclosure>
    </ScrollView>
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
  peerListWrap: {
    marginBottom: 16
  }
})
