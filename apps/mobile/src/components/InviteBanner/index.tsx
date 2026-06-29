import { useEffect, useState } from 'react'
import { Modal, StyleSheet, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Button, useTheme } from '@altersend/components'
import { CheckIcon, CloseIcon, deviceIcon } from '@altersend/components/icons'
import {
  declineInvite,
  dismissInvite,
  formatFileSize,
  joinSession,
  useTransferStore
} from '@altersend/domain'
import { Text } from '@/src/components/ThemedText'
import { useRouter } from 'expo-router'

export function InviteBanner() {
  const { theme } = useTheme()
  const c = theme.colors
  const insets = useSafeAreaInsets()
  const router = useRouter()
  const invite = useTransferStore((s) => s.remember.incomingInvite)
  const [accepted, setAccepted] = useState(false)

  useEffect(() => {
    if (invite) setAccepted(false)
  }, [invite])

  const visible = Boolean(invite && !accepted)

  const accept = () => {
    if (!invite) return
    setAccepted(true)
    dismissInvite()
    void joinSession(invite.topic)
    router.navigate('/receive')
  }

  const decline = () => {
    if (!invite) return
    declineInvite(invite)
  }

  const Icon = invite ? deviceIcon(invite.deviceType) : null

  return (
    <Modal
      visible={visible}
      animationType='slide'
      presentationStyle='pageSheet'
      onRequestClose={decline}
    >
      {invite && Icon ? (
        <View style={[styles.root, { backgroundColor: c.colorBackground }]}>
          <View style={styles.body}>
            <View style={[styles.iconWrap, { backgroundColor: c.colorSurfaceSecondary }]}>
              <Icon size={48} color={c.colorTextPrimary} />
            </View>

            <Text style={[styles.deviceName, { color: c.colorTextPrimary }]}>
              {invite.displayName}
            </Text>

            <Text style={[styles.subtitle, { color: c.colorTextSecondary }]}>
              {`wants to send you ${
                invite.fileCount != null
                  ? `${invite.fileCount} ${invite.fileCount === 1 ? 'file' : 'files'}`
                  : 'files'
              }${invite.totalSize != null && invite.totalSize > 0 ? ` · ${formatFileSize(invite.totalSize)}` : ''}`}
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
                onClick={decline}
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
                onClick={accept}
              >
                Accept
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
