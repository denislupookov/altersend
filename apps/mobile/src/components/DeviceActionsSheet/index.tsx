import { StyleSheet, View } from 'react-native'
import { ListItem } from '@altersend/components'
import { TrashIcon } from '@altersend/components/icons'
import { useTranslation } from '@altersend/locales'
import { BottomSheet } from '../BottomSheet'

interface DeviceActionsSheetProps {
  open: boolean
  onClose: () => void
  onRemove: () => void
}

export function DeviceActionsSheet({ open, onClose, onRemove }: DeviceActionsSheetProps) {
  const { t } = useTranslation(['settings'])

  return (
    <BottomSheet
      open={open}
      onClose={onClose}
      title={t('settings:pairing.deviceActions')}
      sheetStyle={styles.sheet}
    >
      <View style={styles.actionList}>
        <ListItem
          tone='danger'
          size='large'
          square
          icon={<TrashIcon size={16} />}
          label={t('settings:pairing.removeDevice')}
          onClick={onRemove}
        />
      </View>
    </BottomSheet>
  )
}

const styles = StyleSheet.create({
  sheet: { paddingBottom: 32, gap: 12 },
  actionList: { overflow: 'hidden' }
})
