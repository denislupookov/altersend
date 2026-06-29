import { useState } from 'react'
import { Pressable, ScrollView, Share, StyleSheet, View } from 'react-native'
import * as Clipboard from 'expo-clipboard'
import { buildInviteText, formatFileSize, useShareViewModel } from '@altersend/domain'
import { Button, Input, LinkCard, LinkRow, WaitingRadar, useTheme } from '@altersend/components'
import {
  CheckIcon,
  ChevronsUpDownIcon,
  CopyIcon,
  deviceIcon,
  FolderIcon,
  QrCodeIcon,
  ShareIcon
} from '@altersend/components/icons'
import { useTranslation } from '@altersend/locales'
import { useToast } from '@/src/components/Toast'
import { DeviceActionsSheet } from '@/src/components'
import { QRSection } from './QRSection'
import { ShareQrSheet } from './ShareQrSheet'
import { ShareFilesSheet } from './ShareFilesSheet'
import { Text } from '@/src/components/ThemedText'

export function ShareView() {
  const { t } = useTranslation(['send', 'common', 'settings'])
  const { theme } = useTheme()
  const c = theme.colors
  const toast = useToast()
  const vm = useShareViewModel(t, {
    onPeerJoined: (peer) =>
      toast.show({
        title: peer.isKnown
          ? t('send:status.deviceConnected', { name: peer.name })
          : t('send:status.peerConnected'),
        durationMs: 2500
      }),
    onPeerPaired: (peer) =>
      toast.show({ title: t('send:status.pairedToast', { name: peer.name }), durationMs: 2500 }),
    onInviteFailed: (peer) =>
      toast.show({
        title: t('send:status.inviteFailedToast', { name: peer.name }),
        hint: t('send:status.inviteFailedHint'),
        durationMs: 3500
      })
  })
  const [isFilesSheetOpen, setIsFilesSheetOpen] = useState(false)
  const [isQrOpen, setIsQrOpen] = useState(false)
  const [actionsTarget, setActionsTarget] = useState<{ peerKey: string; name: string } | null>(null)

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
            <WaitingRadar
              size={60}
              color={c.colorInfo}
              pulsing
              icon={<ShareIcon size={16} color={c.colorInfo} />}
            />
            <View style={styles.statusText}>
              <Text style={[styles.statusTitle, { color: c.colorTextPrimary }]}>
                {t('send:status.waitingForJoin')}
              </Text>
              <Text style={[styles.statusCaption, { color: c.colorTextMuted }]} numberOfLines={1}>
                {t('send:hints.keepOpen')}
              </Text>
            </View>
          </View>
        )}

        {vm.hasDevices ? (
          <View style={styles.tiles}>
            <View style={styles.tile}>
              <Button
                variant='secondary'
                icon={vm.isCopied ? <CheckIcon size={16} /> : <CopyIcon size={16} />}
                onClick={() => void copyTopic()}
              >
                {vm.isCopied ? t('common:actions.copied') : t('send:connection.copyCode')}
              </Button>
            </View>
            <View style={styles.tile}>
              <Button
                variant='secondary'
                icon={<QrCodeIcon size={16} />}
                onClick={() => setIsQrOpen(true)}
              >
                {t('send:connection.qrCode')}
              </Button>
            </View>
          </View>
        ) : (
          <View style={styles.invitePanel}>
            <QRSection
              topic={vm.topic}
              showWaitingState={false}
              size={200}
              style={styles.qrPanelSection}
            />
            <View style={styles.keyContainer}>
              <Input
                aria-label={t('send:connection.copyLabel')}
                placeholder={t('send:connection.placeholder')}
                readOnly
                trailing={
                  <Button
                    variant={vm.isCopied ? 'success' : 'ghost'}
                    size='sm'
                    iconOnly
                    aria-label={t('send:connection.copyLabel')}
                    disabled={!vm.topic}
                    onClick={() => void copyTopic()}
                    icon={vm.isCopied ? <CheckIcon size={16} /> : <CopyIcon size={16} />}
                  />
                }
                value={vm.topic}
              />
            </View>
          </View>
        )}

        {vm.files.length > 0 && (
          <View style={styles.filesWrap}>
            <LinkCard>
              <LinkRow
                icon={<FolderIcon size={20} color={c.colorTextSecondary} />}
                label={t('common:files.count', { count: vm.files.length })}
                subtitle={formatFileSize(vm.totalSize)}
                onPress={() => setIsFilesSheetOpen(true)}
                trailing={<ChevronsUpDownIcon size={18} color={c.colorTextMuted} />}
                isLast
              />
            </LinkCard>
          </View>
        )}

        {vm.hasDevices && (
          <>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionLabel, { color: c.colorTextSecondary }]}>
                {t('send:peer.devices')}
              </Text>
              {vm.connectedCount > 0 && (
                <Text style={[styles.sectionCount, { color: c.colorTextMuted }]}>
                  {t('send:peer.connectedCount', { count: vm.connectedCount })}
                </Text>
              )}
            </View>
            <View style={styles.section}>
              <LinkCard>
                {vm.devices.map((row, index) => {
                  const isLast = index === vm.devices.length - 1
                  const openActions = () =>
                    setActionsTarget({ peerKey: row.peerKey, name: row.name })
                  if (row.kind === 'connected') {
                    const Icon = row.deviceType ? deviceIcon(row.deviceType) : null
                    return (
                      <Pressable key={row.peerKey} onLongPress={openActions}>
                        <LinkRow
                          icon={
                            Icon ? (
                              <Icon size={18} color={c.colorTextSecondary} />
                            ) : (
                              <Text style={[styles.initials, { color: c.colorInfo }]}>
                                {row.name.slice(0, 2).toUpperCase()}
                              </Text>
                            )
                          }
                          iconBackground={Icon ? c.colorSurfacePrimary : c.colorInfoSubtle}
                          label={row.name}
                          subtitle={row.subtitle}
                          subtitleTone={row.subtitleTone}
                          progressPercent={row.progressPercent}
                          trailing={
                            row.action === 'pair' ? (
                              <Button
                                onClick={() => vm.pair(row.peerKey)}
                                size='sm'
                                variant='secondary'
                                pill
                              >
                                {t('send:peer.pair')}
                              </Button>
                            ) : row.action === 'pair-requested' ? (
                              <Button size='sm' variant='secondary' pill loading>
                                {t('send:peer.requested')}
                              </Button>
                            ) : null
                          }
                          isLast={isLast}
                        />
                      </Pressable>
                    )
                  }
                  const PeerIcon = deviceIcon(row.deviceType)
                  const isActive = row.action === 'inviting' || row.action === 'invite-sent'
                  const label =
                    row.action === 'inviting'
                      ? t('send:peer.inviting')
                      : row.action === 'invite-sent'
                        ? t('send:peer.sent')
                        : t('send:peer.invite')
                  return (
                    <Pressable key={row.peerKey} onLongPress={openActions}>
                      <LinkRow
                        icon={<PeerIcon size={18} color={c.colorTextSecondary} />}
                        label={row.name}
                        subtitle={row.subtitle}
                        subtitleTone={row.subtitleTone}
                        onPress={() => void vm.invite(row.peerKey)}
                        trailing={
                          <Button
                            disabled={isActive}
                            loading={isActive}
                            onClick={() => void vm.invite(row.peerKey)}
                            size='sm'
                            variant='primary'
                            pill
                          >
                            {label}
                          </Button>
                        }
                        isLast={isLast}
                      />
                    </Pressable>
                  )
                })}
              </LinkCard>
            </View>
          </>
        )}
      </ScrollView>

      <ShareQrSheet open={isQrOpen} topic={vm.topic} onClose={() => setIsQrOpen(false)} />

      <DeviceActionsSheet
        open={actionsTarget !== null}
        onClose={() => setActionsTarget(null)}
        onRemove={async () => {
          const target = actionsTarget
          setActionsTarget(null)
          if (!target) return
          const removed = await vm.forget(target.peerKey)
          toast.show({
            title: t(removed ? 'settings:pairing.deviceRemoved' : 'settings:pairing.removeFailed')
          })
        }}
      />

      <ShareFilesSheet
        open={isFilesSheetOpen}
        files={vm.files}
        totalSize={vm.totalSize}
        onClose={() => setIsFilesSheetOpen(false)}
      />
    </>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingTop: 0, paddingBottom: 16 },
  statusStrip: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 24 },
  statusText: { flex: 1, minWidth: 0 },
  statusTitle: { fontSize: 16, fontWeight: '700' },
  statusCaption: { fontSize: 12.5, lineHeight: 17, marginTop: 2 },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
    marginBottom: 8
  },
  sectionLabel: { fontSize: 11, fontWeight: '600', letterSpacing: 1, textTransform: 'uppercase' },
  sectionCount: { fontSize: 11.5, fontWeight: '500' },
  section: { marginBottom: 16 },
  filesWrap: { marginBottom: 24 },
  tiles: { flexDirection: 'row', gap: 12, marginBottom: 24 },
  tile: { flex: 1, minWidth: 0 },
  invitePanel: {
    marginBottom: 20
  },
  keyContainer: { marginTop: 20, width: '100%' },
  qrPanelSection: { paddingTop: 0 },
  initials: { fontSize: 14, fontWeight: '700', letterSpacing: 0.5 }
})
