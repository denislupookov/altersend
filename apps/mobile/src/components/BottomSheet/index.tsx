import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react'
import {
  Animated,
  Dimensions,
  Easing,
  Keyboard,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  View,
  type LayoutChangeEvent,
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

const BACKDROP_DURATION = 220
const EXIT_DURATION = 200
const OFFSCREEN_FALLBACK = Dimensions.get('window').height

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
  const [sheetHeight, setSheetHeight] = useState(0)
  const backdropOpacity = useRef(new Animated.Value(0)).current
  const sheetTranslate = useRef(new Animated.Value(OFFSCREEN_FALLBACK)).current
  const keyboardOffset = useRef(new Animated.Value(0)).current
  const hasOpenedRef = useRef(open)

  const onSheetLayout = useCallback((e: LayoutChangeEvent) => {
    const h = e.nativeEvent.layout.height
    if (h > 0) setSheetHeight((prev) => (prev === h ? prev : h))
  }, [])

  useEffect(() => {
    if (open) hasOpenedRef.current = true
    if (!hasOpenedRef.current) return

    if (open) setMounted(true)

    const distance = sheetHeight || OFFSCREEN_FALLBACK

    const animation = Animated.parallel([
      Animated.timing(backdropOpacity, {
        toValue: open ? 1 : 0,
        duration: open ? BACKDROP_DURATION : EXIT_DURATION,
        easing: open ? Easing.out(Easing.cubic) : Easing.in(Easing.cubic),
        useNativeDriver: true
      }),
      open
        ? Animated.spring(sheetTranslate, {
            toValue: 0,
            damping: 24,
            stiffness: 260,
            mass: 1,
            overshootClamping: true,
            useNativeDriver: true
          })
        : Animated.timing(sheetTranslate, {
            toValue: distance,
            duration: EXIT_DURATION,
            easing: Easing.in(Easing.cubic),
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
  }, [open, sheetHeight, backdropOpacity, sheetTranslate, onDismiss])

  useEffect(() => {
    if (!keyboardAvoiding) return

    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow'
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide'

    const showSub = Keyboard.addListener(showEvent, (e) => {
      Animated.timing(keyboardOffset, {
        toValue: e.endCoordinates.height,
        duration: e.duration || 220,
        useNativeDriver: false
      }).start()
    })
    const hideSub = Keyboard.addListener(hideEvent, (e) => {
      Animated.timing(keyboardOffset, {
        toValue: 0,
        duration: e?.duration || 200,
        useNativeDriver: false
      }).start()
    })

    return () => {
      showSub.remove()
      hideSub.remove()
    }
  }, [keyboardAvoiding, keyboardOffset])

  if (!mounted) return null

  const sheet = (
    <Animated.View
      onLayout={onSheetLayout}
      style={[
        styles.sheet,
        !keyboardAvoiding && styles.sheetAnchored,
        { backgroundColor: c.colorBackground, borderColor: c.colorBorderPrimary },
        { transform: [{ translateY: sheetTranslate }] },
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
        <Animated.View
          pointerEvents='box-none'
          style={[styles.keyboardAvoider, { paddingBottom: keyboardOffset }]}
        >
          {sheet}
        </Animated.View>
      ) : (
        sheet
      )}
    </Modal>
  )
}

const styles = StyleSheet.create({
  backdrop: { ...StyleSheet.absoluteFill },
  keyboardAvoider: { ...StyleSheet.absoluteFill, justifyContent: 'flex-end' },
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
