import { useEffect, useState } from 'react'
import { Pressable, StyleSheet, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useTheme } from '@altersend/components'
import { Smartphone } from 'lucide-react-native'
import { rememberVote, useTransferStore } from '@altersend/domain'
import { Text } from '@/src/components/ThemedText'

export function PairRequestBanner() {
  const { theme } = useTheme()
  const c = theme.colors
  const insets = useSafeAreaInsets()
  const request = useTransferStore((s) => s.remember.incomingRequest)
  const [responded, setResponded] = useState(false)

  useEffect(() => {
    if (request) setResponded(false)
  }, [request])

  if (!request || responded) return null

  const respond = (vote: 'remember' | 'no') => {
    setResponded(true)
    void rememberVote(request.transferId, request.peerKey, vote, false)
  }

  return (
    <View pointerEvents='box-none' style={[styles.container, { top: insets.top + 16 }]}>
      <View
        style={[
          styles.banner,
          {
            backgroundColor: c.colorSurfaceSecondary,
            borderColor: c.colorBorderPrimary,
            shadowColor: c.colorScrim
          }
        ]}
      >
        <View style={[styles.iconWrap, { backgroundColor: c.colorInfoSubtle }]}>
          <Smartphone size={14} color={c.colorInfo} />
        </View>

        <Text style={[styles.label, { color: c.colorTextPrimary }]} numberOfLines={1}>
          {request.displayName} wants to pair
        </Text>

        <Pressable onPress={() => respond('no')} hitSlop={8}>
          <Text style={[styles.action, { color: c.colorTextSecondary }]}>Decline</Text>
        </Pressable>

        <Pressable onPress={() => respond('remember')} hitSlop={8}>
          <Text style={[styles.action, { color: c.colorInfo }]}>Pair</Text>
        </Pressable>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 16,
    right: 16
  },
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 999,
    borderWidth: 1,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.18,
    shadowRadius: 16,
    elevation: 8
  },
  iconWrap: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center'
  },
  label: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600'
  },
  action: {
    fontSize: 14,
    fontWeight: '700'
  }
})
