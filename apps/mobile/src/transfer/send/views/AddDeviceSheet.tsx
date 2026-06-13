import { useEffect, useState } from 'react'
import { ActivityIndicator, Modal, Pressable, StyleSheet, Text, View } from 'react-native'
import { Button, useTheme, withAlpha } from '@altersend/components'
import { deviceIcon } from '@altersend/components/icons'
import { formatRelativeTime, loadPeers, useTransferStore } from '@altersend/domain'

interface AddDeviceSheetProps {
  open: boolean
  onClose: () => void
  onPairNew?: () => void
}

export function AddDeviceSheet({ open, onClose, onPairNew }: AddDeviceSheetProps) {
  const { theme } = useTheme()
  const c = theme.colors
  const peers = useTransferStore((s) => s.peers)
  const [invitingId, setInvitingId] = useState<string | null>(null)

  useEffect(() => {
    if (open) void loadPeers()
    else setInvitingId(null)
  }, [open])

  return (
    <Modal visible={open} transparent animationType='slide' onRequestClose={onClose}>
      <Pressable
        style={[styles.backdrop, { backgroundColor: withAlpha(c.colorScrim, 0.55) }]}
        onPress={onClose}
      />
      <View
        style={[
          styles.sheet,
          { backgroundColor: c.colorBackgroundSubtle, borderColor: c.colorBorderPrimary }
        ]}
      >
        <View style={[styles.grabber, { backgroundColor: c.colorBorderStrong }]} />
        <Text style={[styles.title, { color: c.colorTextPrimary }]}>Add a device</Text>

        {peers.length === 0 ? (
          <Text style={[styles.empty, { color: c.colorTextMuted }]}>
            No paired devices yet. Pair a device to send without a code.
          </Text>
        ) : (
          <View style={styles.list}>
            {peers.map((peer) => {
              const Icon = deviceIcon(peer.deviceType)
              const isInviting = invitingId === peer.remoteDevicePubkey
              return (
                <Pressable
                  key={peer.remoteDevicePubkey}
                  onPress={() => setInvitingId(peer.remoteDevicePubkey)}
                  style={[
                    styles.row,
                    {
                      backgroundColor: isInviting ? c.colorInfoSubtle : c.colorSurfaceSecondary,
                      borderColor: isInviting ? c.colorInfo : c.colorSurfaceSecondary
                    }
                  ]}
                >
                  <View style={[styles.iconWrap, { backgroundColor: c.colorSurfaceTertiary }]}>
                    <Icon size={22} />
                  </View>
                  <View style={styles.rowText}>
                    <Text style={[styles.deviceName, { color: c.colorTextPrimary }]}>
                      {peer.displayName}
                    </Text>
                    {isInviting ? (
                      <View style={styles.invitingRow}>
                        <Text style={[styles.invitingText, { color: c.colorInfo }]}>Inviting…</Text>
                        <ActivityIndicator size='small' color={c.colorInfo} />
                      </View>
                    ) : (
                      <Text style={[styles.lastSent, { color: c.colorTextMuted }]}>
                        Last sent {formatRelativeTime(peer.lastSeenAt)}
                      </Text>
                    )}
                  </View>
                </Pressable>
              )
            })}
          </View>
        )}

        <View style={styles.actions}>
          <Button onClick={onPairNew} variant='secondary' width='full'>
            Pair New Device
          </Button>
          <Button onClick={onClose} variant='ghost' width='full'>
            Done
          </Button>
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
    borderWidth: 1,
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 36,
    gap: 16
  },
  grabber: {
    alignSelf: 'center',
    width: 36,
    height: 4,
    borderRadius: 999,
    marginBottom: 6
  },
  title: {
    fontSize: 28,
    fontWeight: '700'
  },
  list: {
    gap: 10
  },
  empty: {
    fontSize: 14,
    lineHeight: 20,
    paddingVertical: 8
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    borderWidth: 1,
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 14
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center'
  },
  rowText: {
    flex: 1,
    gap: 3
  },
  deviceName: {
    fontSize: 16,
    fontWeight: '700'
  },
  lastSent: {
    fontSize: 13
  },
  invitingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6
  },
  invitingText: {
    fontSize: 14,
    fontWeight: '500'
  },
  actions: {
    gap: 10,
    marginTop: 4
  }
})
