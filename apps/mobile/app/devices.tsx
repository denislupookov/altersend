import { useEffect, useState } from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { formatRelativeTime, loadPeers, useTransferStore } from '@altersend/domain'
import { Button, DeviceRow, useTheme } from '@altersend/components'
import { PlusIcon } from '@altersend/components/icons'
import { useRouter } from 'expo-router'
import { DeviceActionsSheet, Layout } from '@/src/components'

export default function DevicesScreen() {
  const { theme } = useTheme()
  const c = theme.colors
  const router = useRouter()
  const peers = useTransferStore((s) => s.peers)
  const [actionsOpen, setActionsOpen] = useState(false)

  useEffect(() => {
    void loadPeers()
  }, [])

  return (
    <Layout
      title='Paired Devices'
      description='These devices can share files with you directly'
      hasNativeHeader
      footer={
        <Button
          icon={<PlusIcon size={16} />}
          onClick={() => router.push('/(tabs)/send')}
          variant='primary'
          size='lg'
          width='full'
        >
          Pair New Device
        </Button>
      }
    >
      <View style={styles.content}>
        {peers.length === 0 ? (
          <Text style={[styles.empty, { color: c.colorTextMuted }]}>
            No paired devices yet. Pair a device to send without a code.
          </Text>
        ) : (
          <>
            <View
              style={[
                styles.listCard,
                { backgroundColor: c.colorBackgroundSubtle, borderColor: c.colorBorderPrimary }
              ]}
            >
              {peers.map((peer, index) => (
                <View key={peer.remoteDevicePubkey}>
                  <View style={styles.listItem}>
                    <DeviceRow
                      deviceType={peer.deviceType}
                      name={peer.displayName}
                      subtitle={formatRelativeTime(peer.lastSeenAt)}
                      trailing={
                        <DeviceActionsButton
                          color={c.colorTextPrimary}
                          onPress={() => setActionsOpen(true)}
                        />
                      }
                    />
                  </View>
                  {index < peers.length - 1 ? (
                    <View style={[styles.divider, { backgroundColor: c.colorBorderPrimary }]} />
                  ) : null}
                </View>
              ))}
            </View>
          </>
        )}
      </View>
      <DeviceActionsSheet open={actionsOpen} onClose={() => setActionsOpen(false)} />
    </Layout>
  )
}

function DeviceActionsButton({ color, onPress }: { color: string; onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole='button'
      accessibilityLabel='Device actions'
      hitSlop={12}
      onPress={onPress}
      style={({ pressed }) => [styles.actionsButton, { opacity: pressed ? 0.6 : 1 }]}
    >
      <View style={styles.dots}>
        <View style={[styles.dot, { backgroundColor: color }]} />
        <View style={[styles.dot, { backgroundColor: color }]} />
        <View style={[styles.dot, { backgroundColor: color }]} />
      </View>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
    gap: 16,
    paddingBottom: 16
  },
  empty: {
    fontSize: 14,
    lineHeight: 20,
    paddingVertical: 8
  },
  listCard: {
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden'
  },
  listItem: {
    paddingHorizontal: 10
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    marginLeft: 16
  },
  actionsButton: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center'
  },
  dots: {
    gap: 2
  },
  dot: {
    width: 2.5,
    height: 2.5,
    borderRadius: 2
  }
})
