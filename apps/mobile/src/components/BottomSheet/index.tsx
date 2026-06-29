import { type ReactNode } from 'react'
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  View,
  type StyleProp,
  type ViewStyle
} from 'react-native'
import { useTheme, withAlpha } from '@altersend/components'
import { BottomSheetHeader } from '../BottomSheetHeader'

interface BottomSheetProps {
  open: boolean
  onClose: () => void
  title?: string
  subtitle?: string
  onBack?: () => void
  keyboardAvoiding?: boolean
  onDismiss?: () => void
  sheetStyle?: StyleProp<ViewStyle>
  children: ReactNode
}

export function BottomSheet({
  open,
  onClose,
  title,
  subtitle,
  onBack,
  keyboardAvoiding,
  onDismiss,
  sheetStyle,
  children
}: BottomSheetProps) {
  const { theme } = useTheme()
  const c = theme.colors

  const sheet = (
    <View
      style={[
        styles.sheet,
        !keyboardAvoiding && styles.sheetAnchored,
        { backgroundColor: c.colorBackground, borderColor: c.colorBorderPrimary },
        sheetStyle
      ]}
    >
      <View style={[styles.grabber, { backgroundColor: c.colorBorderStrong }]} />
      {(title || onBack) && (
        <View style={styles.header}>
          <BottomSheetHeader
            title={title ?? ''}
            subtitle={subtitle}
            onBack={onBack}
            onClose={onClose}
          />
        </View>
      )}
      {children}
    </View>
  )

  return (
    <Modal
      visible={open}
      transparent
      animationType='slide'
      onDismiss={onDismiss}
      onRequestClose={onClose}
    >
      <Pressable
        style={[styles.backdrop, { backgroundColor: withAlpha(c.colorScrim, 0.55) }]}
        onPress={onClose}
      />
      {keyboardAvoiding ? (
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          pointerEvents='box-none'
          style={styles.keyboardAvoider}
        >
          {sheet}
        </KeyboardAvoidingView>
      ) : (
        sheet
      )}
    </Modal>
  )
}

const styles = StyleSheet.create({
  backdrop: { ...StyleSheet.absoluteFillObject },
  keyboardAvoider: { ...StyleSheet.absoluteFillObject, justifyContent: 'flex-end' },
  sheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: StyleSheet.hairlineWidth,
    paddingTop: 12,
    paddingBottom: 44,
    gap: 16
  },
  sheetAnchored: { position: 'absolute', left: 0, right: 0, bottom: 0 },
  header: { paddingHorizontal: 20 },
  grabber: { alignSelf: 'center', width: 36, height: 4, borderRadius: 999, marginBottom: 8 }
})
