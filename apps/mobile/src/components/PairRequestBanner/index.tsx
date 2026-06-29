import { useEffect, useRef, useState } from 'react'
import { Modal, StyleSheet, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Button, useTheme } from '@altersend/components'
import { CheckIcon, CloseIcon, deviceIcon } from '@altersend/components/icons'
import { rememberVote, usePairingSessionStore, useTransferStore } from '@altersend/domain'
import { Text } from '@/src/components/ThemedText'

export function PairRequestBanner() {
  const { theme } = useTheme()
  const c = theme.colors
  const insets = useSafeAreaInsets()
  const request = useTransferStore((s) => s.remember.incomingRequest)
  const isPairing = usePairingSessionStore((s) => s.activeCount > 0)
  const [responded, setResponded] = useState(false)
  const respondedRef = useRef(false)

  useEffect(() => {
    if (request) {
      setResponded(false)
      respondedRef.current = false
    }
  }, [request])

  const visible = Boolean(request && !responded && !isPairing)

  // Guarded against double-firing: onDismiss (iOS swipe) also fires after a programmatic
  // close, so without the ref a tap on Pair would be followed by a stray 'no' vote.
  const respond = (vote: 'remember' | 'no') => {
    if (!request || respondedRef.current) return
    respondedRef.current = true
    setResponded(true)
    rememberVote({
      transferId: request.transferId,
      peerKey: request.peerKey,
      vote,
      isMine: false
    }).catch(() => {})
  }

  const Icon = request ? deviceIcon(request.deviceType) : null

  return (
    <Modal
      visible={visible}
      animationType='slide'
      presentationStyle='pageSheet'
      onRequestClose={() => respond('no')}
      onDismiss={() => respond('no')}
    >
      {request && Icon ? (
        <View style={[styles.root, { backgroundColor: c.colorBackground }]}>
          <View style={styles.body}>
            <View style={[styles.iconWrap, { backgroundColor: c.colorSurfaceSecondary }]}>
              <Icon size={48} color={c.colorTextPrimary} />
            </View>

            <Text style={[styles.deviceName, { color: c.colorTextPrimary }]}>
              {request.displayName}
            </Text>

            <Text style={[styles.subtitle, { color: c.colorTextSecondary }]}>
              wants to pair with this device
            </Text>
          </View>

          <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 36) }]}>
            <View style={styles.actionWrap}>
              <Button
                variant='danger'
                size='lg'
                pill
                width='full'
                icon={<CloseIcon size={18} color={c.colorDanger} />}
                onClick={() => respond('no')}
              >
                Decline
              </Button>
            </View>
            <View style={styles.actionWrap}>
              <Button
                variant='success'
                size='lg'
                pill
                width='full'
                icon={<CheckIcon size={18} color={c.colorSuccess} />}
                onClick={() => respond('remember')}
              >
                Pair
              </Button>
            </View>
          </View>
        </View>
      ) : null}
    </Modal>
  )
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    justifyContent: 'space-between'
  },
  body: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 14,
    paddingHorizontal: 32
  },
  deviceName: {
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
    marginTop: 8
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginTop: 4
  },
  footer: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 20
  },
  iconWrap: {
    width: 96,
    height: 96,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center'
  },
  actionWrap: {
    flex: 1
  }
})
