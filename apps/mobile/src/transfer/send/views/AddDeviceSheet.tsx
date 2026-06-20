import { useEffect, useState } from 'react'
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native'
import { Button, DeviceRow, useTheme, withAlpha } from '@altersend/components'
import { CloseIcon } from '@altersend/components/icons'
import { InviteStatus, inviteDevice, inviteStatusSubtitle, loadPeers, startSendSession, useTransferStore } from '@altersend/domain'

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
        <View style={styles.header}>
          <Text style={[styles.title, { color: c.colorTextPrimary }]}>Add a device</Text>
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

        <View style={styles.content}>
          {peers.length === 0 ? (
            <Text style={[styles.empty, { color: c.colorTextMuted }]}>
              No paired devices yet. Pair a device to send without a code.
            </Text>
          ) : (
            <View style={styles.list}>
              {peers.map((peer) => {
                const st = status[peer.remoteDevicePubkey]
                const active = st === 'inviting' || st === 'sent'
                const subtitle = inviteStatusSubtitle(st, peer.lastSeenAt)
                return (
                  <DeviceRow
                    key={peer.remoteDevicePubkey}
                    deviceType={peer.deviceType}
                    name={peer.displayName}
                    subtitle={subtitle}
                    subtitleVariant={active ? 'active' : 'default'}
                    isActive={active}
                    onClick={() => void invite(peer.remoteDevicePubkey)}
                  />
                )
              })}
            </View>
          )}
          {onPairNew ? (
            <Button onClick={onPairNew} variant='secondary' width='full'>
              Pair New Device
            </Button>
          ) : null}
        </View>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject
  },
  sheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: StyleSheet.hairlineWidth,
    paddingTop: 12,
    paddingBottom: 32,
    gap: 12
  },
  grabber: {
    alignSelf: 'center',
    width: 36,
    height: 4,
    borderRadius: 999,
    marginBottom: 10
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20
  },
  title: {
    fontSize: 16,
    fontWeight: '700'
  },
  closeButton: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center'
  },
  content: {
    paddingHorizontal: 20,
    gap: 12
  },
  list: {
    gap: 8
  },
  empty: {
    fontSize: 14,
    lineHeight: 20,
    paddingVertical: 8
  }
})
