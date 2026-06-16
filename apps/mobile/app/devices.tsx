import { useEffect, useState } from 'react'
import { Alert, StyleSheet, Text, View } from 'react-native'
import { forgetAllPeers, formatRelativeTime, loadPeers, useTransferStore } from '@altersend/domain'
import { Button, useTheme } from '@altersend/components'
import { deviceIcon } from '@altersend/components/icons'
import { Layout } from '@/src/components'

export default function DevicesScreen() {
  const { theme } = useTheme()
  const c = theme.colors
  const peers = useTransferStore((s) => s.peers)
  const [clearing, setClearing] = useState(false)

  useEffect(() => {
    void loadPeers()
  }, [])

  const handleRemoveAll = () => {
    Alert.alert('Remove all devices?', 'You will need to pair again to send without a code.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove all',
        style: 'destructive',
        onPress: () => {
          setClearing(true)
          void forgetAllPeers().finally(() => setClearing(false))
        }
      }
    ])
  }

  return (
    <Layout title='Devices' description='Devices you have paired with' hasNativeHeader>
      <View style={styles.content}>
        {peers.length === 0 ? (
          <Text style={[styles.empty, { color: c.colorTextMuted }]}>
            No paired devices yet. Pair a device to send without a code.
          </Text>
        ) : (
          <View style={styles.list}>
            {peers.map((peer) => {
              const Icon = deviceIcon(peer.deviceType)
              return (
                <View
                  key={peer.remoteDevicePubkey}
                  style={[
                    styles.row,
                    { backgroundColor: c.colorBackgroundSubtle, borderColor: c.colorBorderPrimary }
                  ]}
                >
                  <View style={[styles.iconWrap, { backgroundColor: c.colorSurfaceTertiary }]}>
                    <Icon size={22} />
                  </View>
                  <View style={styles.rowText}>
                    <Text style={[styles.deviceName, { color: c.colorTextPrimary }]}>
                      {peer.displayName}
                    </Text>
                    <Text style={[styles.lastSent, { color: c.colorTextMuted }]}>
                      Last sent {formatRelativeTime(peer.lastSeenAt)}
                    </Text>
                  </View>
                </View>
              )
            })}
          </View>
        )}

        {peers.length > 0 ? (
          <Button onClick={handleRemoveAll} disabled={clearing} variant='ghost' width='full'>
            Remove all devices
          </Button>
        ) : null}
      </View>
    </Layout>
  )
}

const styles = StyleSheet.create({
  content: {
    gap: 16
  },
  empty: {
    fontSize: 14,
    lineHeight: 20,
    paddingVertical: 8
  },
  list: {
    gap: 10
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
  }
})
