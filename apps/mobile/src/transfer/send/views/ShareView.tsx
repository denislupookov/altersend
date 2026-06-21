import { useEffect, useMemo, useState } from 'react'
import { Pressable, ScrollView, Share, StyleSheet, View } from 'react-native'
import * as Clipboard from 'expo-clipboard'
import {
  buildInviteText,
  formatFileSize,
  formatRelativeTime,
  type InviteStatus,
  inviteDevice,
  inviteStatusSubtitle,
  requestPair,
  startSendSession,
  useTransferStore
} from '@altersend/domain'
import { Button, Disclosure, SendFileListRow, useTheme } from '@altersend/components'
import { AlertCircleIcon, ChevronRightIcon, deviceIcon, FolderIcon, PlusIcon } from '@altersend/components/icons'
import { useTranslation } from '@altersend/locales'
import { useToast } from '@/src/components/Toast'
import { QRSection } from './QRSection'
import { Text } from '@/src/components/ThemedText'
import { AddDeviceSheet } from './AddDeviceSheet'
import { LinkCard } from '@/src/components/LinkRow'


export function ShareView() {
  const { t } = useTranslation(['send', 'common'])
  const { theme } = useTheme()
  const c = theme.colors
  const selectedFiles = useTransferStore((s) => s.selectedFiles)
  const topicRaw = useTransferStore((s) => s.topic)
  const connectionState = useTransferStore((s) => s.connectionState)
  const connectedPeers = useTransferStore((s) => s.connectedPeers)
  const transferId = useTransferStore((s) => s.transferId)
  const pairStatus = useTransferStore((s) => s.remember.pairStatus)
  const peerDisplayNames = useTransferStore((s) => s.remember.peerDisplayNames)
  const rememberedPeers = useTransferStore((s) => s.peers)
  const topic = topicRaw ?? ''
  const isPeerConnected = connectionState === 'peer-connected'
  const [isFilesExpanded, setIsFilesExpanded] = useState(false)
  const [isKeyCopied, setIsKeyCopied] = useState(false)
  const [isAddDeviceOpen, setIsAddDeviceOpen] = useState(false)
  const [inviteStatus, setInviteStatus] = useState<Record<string, InviteStatus>>({})
  const toast = useToast()

  const invite = async (pubkey: string) => {
    if (inviteStatus[pubkey] === 'inviting') return
    setInviteStatus((s) => ({ ...s, [pubkey]: 'inviting' }))
    try {
      const topic = await startSendSession()
      const delivered = await inviteDevice(pubkey, topic)
      setInviteStatus((s) => ({ ...s, [pubkey]: delivered ? 'sent' : 'offline' }))
    } catch {
      setInviteStatus((s) => ({ ...s, [pubkey]: 'offline' }))
    }
  }

  const totalSize = selectedFiles.reduce((sum, file) => sum + (file.size ?? 0), 0)

  const connectedPeerList = useMemo(() => Object.values(connectedPeers), [connectedPeers])
  const connectedKeySet = useMemo(() => new Set(connectedPeerList.map((p) => p.peerKey)), [connectedPeerList])

  const findRemembered = (peerKey: string) => {
    const byKey = rememberedPeers.find((r) => r.remoteDevicePubkey === peerKey)
    if (byKey) return byKey
    const name = peerDisplayNames[peerKey]
    return name ? rememberedPeers.find((r) => r.displayName === name) : undefined
  }

  const connectedDisplayNames = useMemo(
    () => new Set(connectedPeerList.map((p) => peerDisplayNames[p.peerKey]).filter(Boolean) as string[]),
    [connectedPeerList, peerDisplayNames]
  )

  const recentRemembered = useMemo(() => {
    return rememberedPeers
      .filter((p) => !connectedKeySet.has(p.remoteDevicePubkey) && !connectedDisplayNames.has(p.displayName))
      .sort((a, b) => b.lastSeenAt - a.lastSeenAt)
      .slice(0, 2)
  }, [rememberedPeers, connectedKeySet, connectedDisplayNames])

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

  const showWaitingState = !isPeerConnected

  const connectedCount = connectedPeerList.length

  return (
    <>
      <ScrollView style={styles.container}>
        <View style={styles.hint}>
          <AlertCircleIcon size={12} />
          <Text style={[styles.hintText, { color: c.colorTextMuted }]}>
            {t('send:hints.keepOpen')}
          </Text>
        </View>

        <QRSection
          topic={topic}
          isKeyCopied={isKeyCopied}
          onCopy={() => void onCopy()}
          showWaitingState={showWaitingState}
        />

        <View style={styles.devicesWrap}>
          <LinkCard>
            <View style={[styles.devicesHeader, { borderBottomColor: c.colorBorderPrimary }]}>
              <Text style={[styles.devicesLabel, { color: c.colorTextSecondary }]}>DEVICES</Text>
              <Text style={[styles.devicesCount, { color: connectedCount > 0 ? c.colorInfo : c.colorTextMuted }]}>
                {connectedCount} connected
              </Text>
            </View>
            {connectedPeerList.map((peer) => {
              const remembered = findRemembered(peer.peerKey)
              const name = peerDisplayNames[peer.peerKey] ?? remembered?.displayName ?? peer.peerKey.slice(0, 6)
              const isPaired = Boolean(remembered) || pairStatus[peer.peerKey] === 'paired'
              const isRequested = pairStatus[peer.peerKey] === 'requested'
              return (
                <View key={peer.peerKey} style={styles.deviceRow}>
                  {remembered ? (
                    <View style={[styles.iconBox, { backgroundColor: c.colorSurfacePrimary }]}>
                      {(() => { const I = deviceIcon(remembered.deviceType); return <I size={16} color={c.colorTextSecondary} /> })()}
                    </View>
                  ) : (
                    <View style={[styles.iconBox, { backgroundColor: c.colorInfoSubtle }]}>
                      <Text style={[styles.initials, { color: c.colorInfo }]}>{name.slice(0, 2).toUpperCase()}</Text>
                    </View>
                  )}
                  <View style={styles.deviceText}>
                    <Text style={[styles.deviceName, { color: c.colorTextPrimary }]}>{name}</Text>
                    <Text style={[styles.deviceSub, { color: c.colorInfo }]}>● Online</Text>
                  </View>
                  {!isPaired && !isRequested && (
                    <Button
                      onClick={() => handlePair(peer.peerKey)}
                      size='sm'
                      variant='secondary'
                    >
                      Pair
                    </Button>
                  )}
                  <View style={[styles.divider, { backgroundColor: c.colorBorderPrimary }]} />
                </View>
              )
            })}

            {recentRemembered.map((peer) => {
              const st = inviteStatus[peer.remoteDevicePubkey]
              const active = st === 'inviting' || st === 'sent'
              const subtitle = st === 'offline' ? inviteStatusSubtitle(st) : formatRelativeTime(peer.lastSeenAt)
              const subtitleColor = st === 'offline' ? c.colorDanger : c.colorTextMuted
              const PeerIcon = deviceIcon(peer.deviceType)
              return (
                <Pressable
                  key={peer.remoteDevicePubkey}
                  onPress={() => void invite(peer.remoteDevicePubkey)}
                  style={({ pressed }) => [
                    styles.deviceRow,
                    (active || pressed) && { backgroundColor: c.colorSurfacePrimary }
                  ]}
                >
                  <View style={[styles.iconBox, { backgroundColor: c.colorSurfacePrimary }]}>
                    <PeerIcon size={16} color={c.colorTextSecondary} />
                  </View>
                  <View style={styles.deviceText}>
                    <Text style={[styles.deviceName, { color: c.colorTextPrimary }]}>{peer.displayName}</Text>
                    {subtitle ? <Text style={[styles.deviceSub, { color: subtitleColor }]}>{subtitle}</Text> : null}
                  </View>
                  <Button
                    disabled={active}
                    onClick={() => void invite(peer.remoteDevicePubkey)}
                    size='sm'
                    variant='secondary'
                  >
                    {st === 'sent' ? 'Sent' : st === 'inviting' ? 'Inviting…' : 'Invite'}
                  </Button>
                  <View style={[styles.divider, { backgroundColor: c.colorBorderPrimary }]} />
                </Pressable>
              )
            })}

            <Pressable
              accessibilityRole='button'
              onPress={() => setIsAddDeviceOpen(true)}
              style={({ pressed }) => [
                styles.deviceRow,
                pressed && { backgroundColor: c.colorSurfacePrimary }
              ]}
            >
              <View style={[styles.addIcon, { borderColor: c.colorBorderStrong }]}>
                <PlusIcon size={14} color={c.colorTextMuted} />
              </View>
              <Text style={[styles.addLabel, { color: c.colorTextSecondary }]}>
                {connectedCount > 0 ? 'Invite another device' : 'Add a device'}
              </Text>
              <ChevronRightIcon size={14} color={c.colorTextMuted} />
            </Pressable>
          </LinkCard>
        </View>

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
  devicesWrap: {
    marginBottom: 16
  },
  devicesHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth
  },
  devicesLabel: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 1,
    textTransform: 'uppercase'
  },
  devicesCount: {
    fontSize: 11
  },
  deviceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12
  },
  iconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0
  },
  initials: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5
  },
  deviceText: {
    flex: 1
  },
  deviceName: {
    fontSize: 14,
    fontWeight: '500',
    lineHeight: 18
  },
  deviceSub: {
    fontSize: 12,
    lineHeight: 16
  },
  addIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    borderWidth: 1,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0
  },
  addLabel: {
    fontSize: 14,
    fontWeight: '500',
    flex: 1
  },
  divider: {
    position: 'absolute',
    bottom: 0,
    left: 64,
    right: 0,
    height: StyleSheet.hairlineWidth
  }
})
