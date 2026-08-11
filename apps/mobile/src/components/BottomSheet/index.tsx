import { useEffect, useRef, type ReactNode } from 'react'
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native'
import { BottomSheetModal, BottomSheetView } from '@expo/ui/community/bottom-sheet'
import { useTheme } from '@altersend/components'
import { BottomSheetHeader } from '../BottomSheetHeader'

interface BottomSheetProps {
  open: boolean
  onClose: () => void
  title?: string
  subtitle?: string
  onBack?: () => void
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
  onDismiss,
  sheetStyle,
  children
}: BottomSheetProps) {
  const { theme } = useTheme()
  const c = theme.colors
  const sheetRef = useRef<BottomSheetModal>(null)

  useEffect(() => {
    if (open) sheetRef.current?.present()
    else sheetRef.current?.dismiss()
  }, [open])

  return (
    <BottomSheetModal
      ref={sheetRef}
      enableDynamicSizing
      enablePanDownToClose
      keyboardBehavior='interactive'
      onClose={() => {
        onClose()
        onDismiss?.()
      }}
      backgroundStyle={{ backgroundColor: c.colorBackground }}
      handleIndicatorStyle={{ backgroundColor: c.colorBorderStrong }}
    >
      <BottomSheetView style={[styles.body, sheetStyle]}>
        <View style={styles.header}>
          <BottomSheetHeader
            title={title ?? ''}
            subtitle={subtitle}
            onBack={onBack}
            onClose={() => sheetRef.current?.dismiss()}
          />
        </View>
        {children}
      </BottomSheetView>
    </BottomSheetModal>
  )
}

const styles = StyleSheet.create({
  body: { paddingBottom: 44, gap: 16 },
  header: { paddingHorizontal: 16, paddingTop: 12 }
})
