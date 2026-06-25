import { useEffect, useState } from 'react'
import { Pressable, StyleSheet, View } from 'react-native'
import { loadPeers, useTransferStore } from '@altersend/domain'
import { Button, LinkCard, LinkRow, useTheme } from '@altersend/components'
import { PlusIcon, deviceIcon } from '@altersend/components/icons'
import { useRouter } from 'expo-router'
import { DeviceActionsSheet, Layout } from '@/src/components'
import { Text } from '@/src/components/ThemedText'

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
          <LinkCard>
            {peers.map((peer, index) => {
              const Icon = deviceIcon(peer.deviceType)
              return (
                <LinkRow
                  key={peer.remoteDevicePubkey}
                  icon={<Icon size={16} color={c.colorTextSecondary} />}
                  label={peer.displayName}
                  trailing={
                    <DeviceActionsButton
                      color={c.colorTextMuted}
                      onPress={() => setActionsOpen(true)}
                    />
                  }
                  isLast={index === peers.length - 1}
                />
              )
            })}
          </LinkCard>
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
