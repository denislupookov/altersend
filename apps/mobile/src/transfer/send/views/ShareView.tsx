import { useEffect, useMemo, useRef, useState } from 'react'
import { Modal, Pressable, ScrollView, Share, StyleSheet, View } from 'react-native'
import * as Clipboard from 'expo-clipboard'
import { buildInviteText, formatFileSize, useShareViewModel } from '@altersend/domain'
import { Button, Input, LinkCard, LinkRow, WaitingRadar, useTheme, withAlpha } from '@altersend/components'
import { CheckIcon, ChevronDownIcon, ChevronUpIcon, CloseIcon, CopyIcon, deviceIcon, FolderIcon, QrCodeIcon, ShareIcon } from '@altersend/components/icons'
import { useTranslation } from '@altersend/locales'
import { useToast } from '@/src/components/Toast'
import { QRSection } from './QRSection'
import { Text } from '@/src/components/ThemedText'

export function ShareView() {
  const { t } = useTranslation(['send', 'common'])
  const { theme } = useTheme()
  const c = theme.colors
  const vm = useShareViewModel(t)
  const [isFilesExpanded, setIsFilesExpanded] = useState(false)
  const [isQrOpen, setIsQrOpen] = useState(false)
  const toast = useToast()
  const connectedPeerKeysRef = useRef<Set<string> | null>(null)
  const connectedRows = useMemo(
    () => vm.devices.filter((row) => row.kind === 'connected'),
    [vm.devices]
  )

  useEffect(() => {
    const currentKeys = new Set(connectedRows.map((row) => row.peerKey))
    const previousKeys = connectedPeerKeysRef.current
    connectedPeerKeysRef.current = currentKeys

    if (!previousKeys) return

    const joinedPeer = connectedRows.find((row) => !previousKeys.has(row.peerKey))
    if (!joinedPeer) return

    toast.show({
      title: t('send:status.peerConnected'),
      hint: `${joinedPeer.name} joined`,
      durationMs: 2500
    })
  }, [connectedRows, t, toast])

  const copyTopic = async () => {
    if (!vm.topic) return
    try {
      await Clipboard.setStringAsync(vm.topic)
      vm.markCopied()
      toast.show({ title: t('send:connection.copiedToast') })
      await Share.share({ message: buildInviteText(vm.topic) })
    } catch (error) {
      console.error(error)
    }
  }

  return (
    <>
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        {vm.phase === 'waiting' && (
          <View style={styles.statusStrip}>
            <WaitingRadar size={60} color={c.colorInfo} pulsing icon={<ShareIcon size={16} color={c.colorInfo} />} />
            <View style={styles.statusText}>
              <Text style={[styles.statusTitle, { color: c.colorTextPrimary }]}>Waiting for someone to join</Text>
              <Text style={[styles.statusCaption, { color: c.colorTextMuted }]} numberOfLines={1}>{t('send:hints.keepOpen')}</Text>
            </View>
          </View>
        )}

        {vm.hasDevices ? (
          <View style={styles.tiles}>
            <View style={styles.tile}>
              <Button variant='secondary' width='full' icon={vm.isCopied ? <CheckIcon size={16} /> : <CopyIcon size={16} />} onClick={() => void copyTopic()}>
                {vm.isCopied ? 'Copied' : 'Copy code'}
              </Button>
            </View>
            <View style={styles.tile}>
              <Button variant='secondary' width='full' icon={<QrCodeIcon size={16} />} onClick={() => setIsQrOpen(true)}>
                QR code
              </Button>
            </View>
          </View>
        ) : (
          <View style={styles.invitePanel}>
            <QRSection topic={vm.topic} showWaitingState={false} size={200} style={styles.qrPanelSection} />
            <View style={styles.keyContainer}>
              <TopicCodeField
                copied={vm.isCopied}
                onCopy={() => void copyTopic()}
                placeholder={t('send:connection.placeholder')}
                topic={vm.topic}
              />
            </View>
          </View>
        )}

        <View style={styles.filesWrap}>
          <LinkCard>
            <LinkRow
              icon={<FolderIcon size={20} color={c.colorTextSecondary} />}
              label={vm.files.length === 1 ? '1 file' : `${vm.files.length} files`}
              subtitle={formatFileSize(vm.totalSize)}
              onPress={() => setIsFilesExpanded(!isFilesExpanded)}
              trailing={isFilesExpanded ? <ChevronUpIcon size={20} color={c.colorTextMuted} /> : <ChevronDownIcon size={20} color={c.colorTextMuted} />}
              isLast={!isFilesExpanded}
            />
            {isFilesExpanded && vm.files.map((file, index) => (
              <LinkRow key={file.path} file label={file.name} size={file.size} isLast={index === vm.files.length - 1} />
            ))}
          </LinkCard>
        </View>

        {vm.hasDevices && (
          <>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionLabel, { color: c.colorTextSecondary }]}>DEVICES</Text>
              {vm.connectedCount > 0 && (
                <Text style={[styles.sectionCount, { color: c.colorTextMuted }]}>
                  {vm.connectedCount === 1 ? '1 connected' : `${vm.connectedCount} connected`}
                </Text>
              )}
            </View>
            <View style={styles.section}>
              <LinkCard>
                {vm.devices.map((row, index) => {
                  const isLast = index === vm.devices.length - 1
                  if (row.kind === 'connected') {
                    const Icon = row.deviceType ? deviceIcon(row.deviceType) : null
                    return (
                      <LinkRow
                        key={row.peerKey}
                        icon={
                          Icon
                            ? <Icon size={18} color={c.colorTextSecondary} />
                            : <Text style={[styles.initials, { color: c.colorInfo }]}>{row.name.slice(0, 2).toUpperCase()}</Text>
                        }
                        iconBackground={Icon ? c.colorSurfacePrimary : c.colorInfoSubtle}
                        label={row.name}
                        subtitle={row.subtitle}
                        subtitleTone={row.subtitleTone}
                        progressPercent={row.progressPercent}
                        trailing={row.action === 'pair' ? <Button onClick={() => vm.pair(row.peerKey)} size='sm' variant='secondary' pill>Pair</Button> : null}
                        isLast={isLast}
                      />
                    )
                  }
                  const PeerIcon = deviceIcon(row.deviceType)
                  const isActive = row.action === 'inviting' || row.action === 'invite-sent'
                  const label = row.action === 'inviting' ? 'Inviting…' : row.action === 'invite-sent' ? 'Sent' : 'Invite'
                  return (
                    <LinkRow
                      key={row.peerKey}
                      icon={<PeerIcon size={18} color={c.colorTextSecondary} />}
                      label={row.name}
                      subtitle={row.subtitle}
                      subtitleTone={row.subtitleTone}
                      isActive={isActive}
                      onPress={() => void vm.invite(row.peerKey)}
                      trailing={
                        <Button disabled={isActive} onClick={() => void vm.invite(row.peerKey)} size='sm' variant='primary' pill>
                          {label}
                        </Button>
                      }
                      isLast={isLast}
                    />
                  )
                })}
              </LinkCard>
            </View>
          </>
        )}
      </ScrollView>

      <Modal visible={isQrOpen} transparent animationType='slide' onRequestClose={() => setIsQrOpen(false)}>
        <Pressable style={[styles.backdrop, { backgroundColor: withAlpha(c.colorScrim, 0.55) }]} onPress={() => setIsQrOpen(false)} />
        <View style={[styles.sheet, { backgroundColor: c.colorBackground, borderColor: c.colorBorderPrimary }]}>
          <View style={[styles.grabber, { backgroundColor: c.colorBorderStrong }]} />
          <View style={styles.sheetHeader}>
            <Text style={[styles.sheetTitle, { color: c.colorTextPrimary }]}>Scan to connect</Text>
            <Pressable accessibilityRole='button' accessibilityLabel='Close' hitSlop={12} onPress={() => setIsQrOpen(false)}>
              <CloseIcon size={20} color={c.colorTextPrimary} />
            </Pressable>
          </View>
          <QRSection topic={vm.topic} showWaitingState={false} />
        </View>
      </Modal>
    </>
  )
}

function TopicCodeField({
  copied,
  onCopy,
  placeholder,
  topic
}: {
  copied: boolean
  onCopy: () => void
  placeholder: string
  topic: string
}) {
  const { t } = useTranslation(['send'])

  return (
    <Input
      aria-label={t('send:connection.copyLabel')}
      mono
      placeholder={placeholder}
      readOnly
      secure
      trailing={
        <Pressable
          accessibilityLabel={t('send:connection.copyLabel')}
          accessibilityRole='button'
          disabled={!topic}
          onPress={onCopy}
          style={({ pressed }) => [styles.copyButton, pressed && styles.copyButtonPressed]}
        >
          {copied ? <CheckIcon size={16} /> : <CopyIcon size={16} />}
        </Pressable>
      }
      value={topic}
    />
  )
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingTop: 0, paddingBottom: 16 },
  statusStrip: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 24 },
  statusText: { flex: 1, minWidth: 0 },
  statusTitle: { fontSize: 16, fontWeight: '700' },
  statusCaption: { fontSize: 12.5, lineHeight: 17, marginTop: 2 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 4, marginBottom: 8 },
  sectionLabel: { fontSize: 11, fontWeight: '600', letterSpacing: 1, textTransform: 'uppercase' },
  sectionCount: { fontSize: 11.5, fontWeight: '500' },
  section: { marginBottom: 16 },
  filesWrap: { marginBottom: 24 },
  tiles: { flexDirection: 'row', gap: 12, marginBottom: 24 },
  tile: { flex: 1 },
  invitePanel: {
    marginBottom: 20
  },
  keyContainer: { marginTop: 20, width: '100%' },
  copyButton: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center'
  },
  copyButtonPressed: { opacity: 0.55 },
  qrPanelSection: { paddingTop: 0 },
  initials: { fontSize: 14, fontWeight: '700', letterSpacing: 0.5 },
  backdrop: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
  sheet: { position: 'absolute', left: 0, right: 0, bottom: 0, borderTopLeftRadius: 24, borderTopRightRadius: 24, borderWidth: StyleSheet.hairlineWidth, paddingHorizontal: 20, paddingTop: 12, paddingBottom: 48, gap: 12 },
  grabber: { alignSelf: 'center', width: 36, height: 4, borderRadius: 999, marginBottom: 4 },
  sheetHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  sheetTitle: { fontSize: 16, fontWeight: '700' }
})
