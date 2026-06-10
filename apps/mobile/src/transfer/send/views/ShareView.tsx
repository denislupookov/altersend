import { useEffect, useMemo, useState } from 'react'
import { ScrollView, Share, StyleSheet, Text, View } from 'react-native'
import * as Clipboard from 'expo-clipboard'
import {
  buildInviteText,
  formatFileSize,
  getPeerListEntries,
  senderKeepOpenHint,
  useTransferStore
} from '@altersend/domain'
import { Disclosure, PeerListCard, SendFileListRow, useTheme } from '@altersend/components'
import { AlertCircleIcon, FolderIcon } from '@altersend/components/icons'
import { useToast } from '@/src/components/Toast'
import { QRSection } from './QRSection'

export function ShareView() {
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
  const hasActivity = isPeerConnected || peerEntries.length > 0
  const showWaitingState = !hasActivity

  const onCopy = async () => {
    if (!topic) return
    try {
      await Clipboard.setStringAsync(topic)
      setIsKeyCopied(true)
      toast.show({ title: 'Copied to clipboard' })
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
          {senderKeepOpenHint}
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
          <PeerListCard entries={peerEntries} />
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
