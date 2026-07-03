import { useEffect, useRef, useState, type ReactNode } from 'react'
import {
  Animated,
  Easing,
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

const ENTER_DURATION = 240
const EXIT_DURATION = 180
const SHEET_RISE = 24

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
  const [mounted, setMounted] = useState(open)
  const backdropOpacity = useRef(new Animated.Value(0)).current
  const sheetTranslate = useRef(new Animated.Value(SHEET_RISE)).current
  const sheetOpacity = useRef(new Animated.Value(0)).current
  const hasOpenedRef = useRef(open)

  useEffect(() => {
    if (open) hasOpenedRef.current = true
    if (!hasOpenedRef.current) return

    if (open) setMounted(true)

    const duration = open ? ENTER_DURATION : EXIT_DURATION
    const easing = open ? Easing.out(Easing.cubic) : Easing.in(Easing.cubic)

    const animation = Animated.parallel([
      Animated.timing(backdropOpacity, {
        toValue: open ? 1 : 0,
        duration,
        easing,
        useNativeDriver: true
      }),
      Animated.timing(sheetTranslate, {
        toValue: open ? 0 : SHEET_RISE,
        duration,
        easing,
        useNativeDriver: true
      }),
      Animated.timing(sheetOpacity, {
        toValue: open ? 1 : 0,
        duration,
        easing,
        useNativeDriver: true
      })
    ])
    animation.start(({ finished }) => {
      if (finished && !open) {
        setMounted(false)
        onDismiss?.()
      }
    })
    return () => animation.stop()
  }, [open, backdropOpacity, sheetTranslate, sheetOpacity, onDismiss])

  if (!mounted) return null

  const sheet = (
    <Animated.View
      style={[
        styles.sheet,
        !keyboardAvoiding && styles.sheetAnchored,
        { backgroundColor: c.colorBackground, borderColor: c.colorBorderPrimary },
        { opacity: sheetOpacity, transform: [{ translateY: sheetTranslate }] },
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
    </Animated.View>
  )

  return (
    <Modal visible={mounted} transparent animationType='none' onRequestClose={onClose}>
      <Animated.View
        style={[
          styles.backdrop,
          { backgroundColor: withAlpha(c.colorScrim, 0.55), opacity: backdropOpacity }
        ]}
      >
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
      </Animated.View>
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
