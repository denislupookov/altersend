import { useEffect, useState } from 'react'
import { Modal, Pressable, StyleSheet, View } from 'react-native'
import { Button, LinkCard, LinkRow, useTheme, withAlpha } from '@altersend/components'
import { CloseIcon, deviceIcon } from '@altersend/components/icons'
import { InviteStatus, inviteDevice, inviteStatusSubtitle, loadPeers, startSendSession, useTransferStore } from '@altersend/domain'
import { Text } from '@/src/components/ThemedText'

interface AddDeviceSheetProps {
  open: boolean
  onClose: () => void
  onPairNew?: () => void
}

export function AddDeviceSheet({ open, onClose, onPairNew }: AddDeviceSheetProps) {
  const { theme } = useTheme()
  const c = theme.colors
  const peers = useTransferStore((s) => s.peers)
  const [status, setStatus] = useState<Record<string, InviteStatus>>({})

  useEffect(() => {
    if (open) void loadPeers()
    else setStatus({})
  }, [open])

  const invite = async (pubkey: string) => {
    if (status[pubkey] === 'inviting') return
    setStatus((s) => ({ ...s, [pubkey]: 'inviting' }))
    try {
      const topic = await startSendSession()
      const delivered = await inviteDevice(pubkey, topic)
      setStatus((s) => ({ ...s, [pubkey]: delivered ? 'sent' : 'offline' }))
    } catch {
      setStatus((s) => ({ ...s, [pubkey]: 'offline' }))
    }
  }

  return (
    <Modal visible={open} transparent animationType='slide' onRequestClose={onClose}>
      <Pressable
        style={[styles.backdrop, { backgroundColor: withAlpha(c.colorScrim, 0.55) }]}
        onPress={onClose}
      />
      <View
        style={[
          styles.sheet,
          { backgroundColor: c.colorBackground, borderColor: c.colorBorderPrimary }
        ]}
      >
        <View style={[styles.grabber, { backgroundColor: c.colorBorderStrong }]} />

        <View style={styles.sheetHeader}>
          <Text style={[styles.sheetTitle, { color: c.colorTextPrimary }]}>Add a device</Text>
          <Pressable
            accessibilityRole='button'
            accessibilityLabel='Close'
            hitSlop={12}
            onPress={onClose}
            style={({ pressed }) => [styles.closeButton, { opacity: pressed ? 0.6 : 1 }]}
          >
            <CloseIcon size={20} color={c.colorTextPrimary} />
          </Pressable>
        </View>

        <View style={styles.deviceList}>
          {peers.length === 0 ? (
            <Text style={[styles.empty, { color: c.colorTextMuted }]}>
              No paired devices yet. Pair a device to send without a code.
            </Text>
          ) : (
            <LinkCard>
              {peers.map((peer, index) => {
                const st = status[peer.remoteDevicePubkey]
                const active = st === 'inviting' || st === 'sent'
                const subtitle = inviteStatusSubtitle(st)
                const Icon = deviceIcon(peer.deviceType)
                const subtitleTone = st === 'offline' ? 'danger' : active ? 'success' : 'muted'
                return (
                  <LinkRow
                    key={peer.remoteDevicePubkey}
                    icon={<Icon size={16} color={c.colorTextSecondary} />}
                    label={peer.displayName}
                    subtitle={subtitle}
                    subtitleTone={subtitleTone}
                    isActive={active}
                    trailing={null}
                    onPress={() => void invite(peer.remoteDevicePubkey)}
                    isLast={index === peers.length - 1}
                  />
                )
              })}
            </LinkCard>
          )}
        </View>

        {onPairNew ? (
          <View style={styles.actions}>
            <Button onClick={onPairNew} variant='secondary' width='full'>
              Pair New Device
            </Button>
          </View>
        ) : null}
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0
  },
  sheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 0,
    paddingTop: 12,
    paddingBottom: 48,
    gap: 12
  },
  grabber: {
    alignSelf: 'center',
    width: 36,
    height: 4,
    borderRadius: 999,
    marginBottom: 10
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20
  },
  sheetTitle: {
    fontSize: 16,
    fontWeight: '700'
  },
  closeButton: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center'
  },
  deviceList: {
    paddingHorizontal: 20
  },
  empty: {
    fontSize: 14,
    lineHeight: 20,
    paddingVertical: 8
  },
  actions: {
    paddingHorizontal: 20
  }
})
