import { StyleSheet, View } from 'react-native'
import { Button, LinkRow, useTheme } from '@altersend/components'
import { MoreVerticalIcon, PlusIcon, deviceIcon } from '@altersend/components/icons'
import { useTranslation } from '@altersend/locales'
import {
  AddPairDeviceSheet,
  DeviceActionsSheet,
  Layout,
  PairingManualCodeSheet,
  PairingQrSheet,
  PairingScanSheet
} from '@/src/components'
import { Text } from '@/src/components/ThemedText'
import { usePairingFlow } from '@/src/pairing/usePairingFlow'
import SyncDevicesSvg from '../../../assets/sync_devices.svg'

export default function DevicesScreen() {
  const { t } = useTranslation(['settings'])
  const { theme } = useTheme()
  const c = theme.colors
  const flow = usePairingFlow()

  return (
    <Layout
      title={t('settings:pairing.pairedDevices')}
      hasNativeHeader
      footer={
        <Button
          icon={<PlusIcon size={16} />}
          onClick={flow.openAddSheet}
          variant='primary'
          size='lg'
          width='full'
        >
          {t('settings:pairing.pairANewDevice')}
        </Button>
      }
    >
      {flow.peers.length === 0 ? (
        <View style={styles.emptyState}>
          <View style={styles.illustration}>
            <SyncDevicesSvg width='100%' height='100%' />
          </View>
          <Text style={[styles.emptyTitle, { color: c.colorTextPrimary }]}>
            {t('settings:pairing.noPairedDevices')}
          </Text>
          <Text style={[styles.emptySubtitle, { color: c.colorTextMuted }]}>
            {t('settings:pairing.noPairedDevicesHint')}
          </Text>
        </View>
      ) : (
        <View style={styles.content}>
          {flow.peers.map((peer) => {
            const Icon = deviceIcon(peer.deviceType)
            return (
              <LinkRow
                key={peer.remoteDevicePubkey}
                standalone
                icon={<Icon size={16} color={c.colorTextSecondary} />}
                label={peer.displayName}
                trailing={
                  <Button
                    variant='ghost'
                    size='sm'
                    iconOnly
                    aria-label={t('settings:pairing.deviceActions')}
                    icon={<MoreVerticalIcon size={14} />}
                    onClick={() =>
                      flow.openDeviceActions(peer.remoteDevicePubkey, peer.displayName)
                    }
                  />
                }
              />
            )
          })}
        </View>
      )}

      <DeviceActionsSheet {...flow.deviceActionsSheet} />
      <AddPairDeviceSheet {...flow.addSheet} />
      <PairingQrSheet {...flow.qrSheet} />
      <PairingScanSheet {...flow.scanSheet} />
      <PairingManualCodeSheet {...flow.manualSheet} />
    </Layout>
  )
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
    gap: 10,
    paddingBottom: 16
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 48
  },
  illustration: {
    width: '80%',
    aspectRatio: 1058 / 747.88979
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginTop: 28,
    textAlign: 'center'
  },
  emptySubtitle: {
    fontSize: 14,
    lineHeight: 20,
    marginTop: 6,
    textAlign: 'center'
  }
})
