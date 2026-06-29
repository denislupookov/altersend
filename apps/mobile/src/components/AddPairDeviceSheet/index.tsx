import { StyleSheet, View } from 'react-native'
import { ActionRow, useTheme } from '@altersend/components'
import { ClipboardIcon, CodeIcon, QrCodeIcon } from '@altersend/components/icons'
import { useTranslation } from '@altersend/locales'
import { BottomSheet } from '../BottomSheet'

interface AddPairDeviceSheetProps {
  open: boolean
  onClose: () => void
  onDismiss?: () => void
  onShowQrCode: () => void
  onScanQrCode: () => void
  onEnterCode: () => void
}

export function AddPairDeviceSheet({
  open,
  onClose,
  onDismiss,
  onShowQrCode,
  onScanQrCode,
  onEnterCode
}: AddPairDeviceSheetProps) {
  const { t } = useTranslation(['settings'])
  const { theme } = useTheme()
  const c = theme.colors

  return (
    <BottomSheet
      open={open}
      onClose={onClose}
      onDismiss={onDismiss}
      title={t('settings:pairing.pairNewDevice')}
      sheetStyle={styles.sheet}
    >
      <View style={styles.actionList}>
        <ActionRow
          icon={<QrCodeIcon size={15} />}
          title={t('settings:pairing.showQrCode')}
          subtitle={t('settings:pairing.showQrCodeHint')}
          onClick={onShowQrCode}
        />
        <View style={[styles.divider, { backgroundColor: c.colorBorderPrimary }]} />
        <ActionRow
          icon={<CodeIcon size={15} />}
          title={t('settings:pairing.scanQrCode')}
          subtitle={t('settings:pairing.scanQrCodeHint')}
          onClick={onScanQrCode}
        />
        <View style={[styles.divider, { backgroundColor: c.colorBorderPrimary }]} />
        <ActionRow
          icon={<ClipboardIcon size={15} />}
          title={t('settings:pairing.enterCode')}
          subtitle={t('settings:pairing.enterCodeHint')}
          onClick={onEnterCode}
        />
      </View>
    </BottomSheet>
  )
}

const styles = StyleSheet.create({
  sheet: { paddingBottom: 46, gap: 10 },
  actionList: { paddingTop: 8 },
  divider: { height: 1, marginRight: 20, marginLeft: 50 }
})
