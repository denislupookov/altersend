import { StyleSheet, View } from 'react-native'
import { ListItem } from '@altersend/components'
import { PencilIcon, TrashIcon } from '@altersend/components/icons'
import { useTranslation } from '@altersend/locales'
import { BottomSheet } from '../BottomSheet'

interface DeviceActionsSheetProps {
  open: boolean
  onClose: () => void
  onRemove: () => void
  onRename: () => void
}

export function DeviceActionsSheet({ open, onClose, onRemove, onRename }: DeviceActionsSheetProps) {
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
          size='large'
          square
          icon={<PencilIcon size={16} />}
          label={t('settings:pairing.renameDevice')}
          onClick={onRename}
        />
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
