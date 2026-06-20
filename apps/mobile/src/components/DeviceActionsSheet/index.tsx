import { Modal, Pressable, StyleSheet, Text, View } from 'react-native'
import { useTheme, withAlpha } from '@altersend/components'
import { CloseIcon, PencilIcon, TrashIcon } from '@altersend/components/icons'

interface DeviceActionsSheetProps {
  open: boolean
  onClose: () => void
}

export function DeviceActionsSheet({ open, onClose }: DeviceActionsSheetProps) {
  const { theme } = useTheme()
  const c = theme.colors

  return (
    <Modal visible={open} transparent animationType='slide' onRequestClose={onClose}>
      <Pressable
        style={[styles.backdrop, { backgroundColor: withAlpha(c.colorScrim, 0.55) }]}
        onPress={onClose}
      />
      <View
        style={[
          styles.sheet,
          { backgroundColor: c.colorBackground, borderColor: c.colorBorderPrimary }
        ]}
      >
        <View style={[styles.grabber, { backgroundColor: c.colorBorderStrong }]} />
        <View style={styles.sheetHeader}>
          <Text style={[styles.sheetTitle, { color: c.colorTextPrimary }]}>Device Actions</Text>
          <Pressable
            accessibilityRole='button'
            accessibilityLabel='Close device actions'
            hitSlop={12}
            onPress={onClose}
            style={({ pressed }) => [styles.closeButton, { opacity: pressed ? 0.6 : 1 }]}
          >
            <CloseIcon size={20} color={c.colorTextPrimary} />
          </Pressable>
        </View>
        <View style={styles.actionList}>
          <Pressable
            accessibilityRole='button'
            onPress={onClose}
            style={({ pressed }) => [
              styles.actionRow,
              pressed && { backgroundColor: c.colorSurfacePrimary }
            ]}
          >
            <PencilIcon size={16} color={c.colorTextPrimary} />
            <Text style={[styles.actionText, { color: c.colorTextPrimary }]}>Rename Device</Text>
          </Pressable>
          <View style={[styles.actionDivider, { backgroundColor: c.colorBorderPrimary }]} />
          <Pressable
            accessibilityRole='button'
            onPress={onClose}
            style={({ pressed }) => [
              styles.actionRow,
              pressed && { backgroundColor: c.colorDangerSubtle }
            ]}
          >
            <TrashIcon size={16} color={c.colorDanger} />
            <Text style={[styles.actionText, { color: c.colorDanger }]}>Unpair Device</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject
  },
  sheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 0,
    paddingTop: 12,
    paddingBottom: 32,
    gap: 12
  },
  grabber: {
    alignSelf: 'center',
    width: 36,
    height: 4,
    borderRadius: 999,
    marginBottom: 10
  },
  sheetTitle: {
    fontSize: 16,
    fontWeight: '700'
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20
  },
  closeButton: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center'
  },
  actionList: {
    overflow: 'hidden',
    gap: 0
  },
  actionRow: {
    minHeight: 56,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 20,
    paddingVertical: 16
  },
  actionDivider: {
    height: StyleSheet.hairlineWidth,
    marginHorizontal: 20
  },
  actionText: {
    fontSize: 15,
    fontWeight: '600'
  }
})
