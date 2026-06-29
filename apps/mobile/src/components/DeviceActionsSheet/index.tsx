import { Pressable, StyleSheet, View } from 'react-native'
import { useTheme } from '@altersend/components'
import { TrashIcon } from '@altersend/components/icons'
import { useTranslation } from '@altersend/locales'
import { BottomSheet } from '../BottomSheet'
import { Text } from '../ThemedText'

interface DeviceActionsSheetProps {
  open: boolean
  onClose: () => void
  onRemove: () => void
}

export function DeviceActionsSheet({ open, onClose, onRemove }: DeviceActionsSheetProps) {
  const { t } = useTranslation(['settings'])
  const { theme } = useTheme()
  const c = theme.colors

  return (
    <BottomSheet
      open={open}
      onClose={onClose}
      title={t('settings:pairing.deviceActions')}
      sheetStyle={styles.sheet}
    >
      <View style={styles.actionList}>
        <Pressable
          accessibilityRole='button'
          onPress={onRemove}
          style={({ pressed }) => [
            styles.actionRow,
            pressed && { backgroundColor: c.colorDangerSubtle }
          ]}
        >
          <TrashIcon size={16} color={c.colorDanger} />
          <Text style={[styles.actionText, { color: c.colorDanger }]}>
            {t('settings:pairing.removeDevice')}
          </Text>
        </Pressable>
      </View>
    </BottomSheet>
  )
}

const styles = StyleSheet.create({
  sheet: { paddingBottom: 32, gap: 12 },
  actionList: { overflow: 'hidden' },
  actionRow: {
    minHeight: 56,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 20,
    paddingVertical: 16
  },
  actionText: { fontSize: 15, fontWeight: '600' }
})
