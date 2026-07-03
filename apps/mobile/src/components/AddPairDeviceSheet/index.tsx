import { StyleSheet, View } from 'react-native'
import { ListItem, useTheme } from '@altersend/components'
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
        <ListItem
          icon={<QrCodeIcon size={15} />}
          label={t('settings:pairing.showQrCode')}
          variant='plain'
          size='large'
          square
          onClick={onShowQrCode}
        />
        <View style={[styles.divider, { backgroundColor: c.colorBorderPrimary }]} />
        <ListItem
          icon={<CodeIcon size={15} />}
          label={t('settings:pairing.scanQrCode')}
          variant='plain'
          size='large'
          square
          onClick={onScanQrCode}
        />
        <View style={[styles.divider, { backgroundColor: c.colorBorderPrimary }]} />
        <ListItem
          icon={<ClipboardIcon size={15} />}
          label={t('settings:pairing.enterCode')}
          variant='plain'
          size='large'
          square
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
