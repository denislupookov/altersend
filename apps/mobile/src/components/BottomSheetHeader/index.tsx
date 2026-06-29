import { Pressable, StyleSheet, View } from 'react-native'
import { useTheme } from '@altersend/components'
import { ArrowLeftIcon, CloseIcon } from '@altersend/components/icons'
import { Text } from '../ThemedText'

interface BottomSheetHeaderProps {
  title: string
  subtitle?: string
  onBack?: () => void
  onClose: () => void
}

export function BottomSheetHeader({ title, subtitle, onBack, onClose }: BottomSheetHeaderProps) {
  const { theme } = useTheme()
  const c = theme.colors
  return (
    <View style={styles.header}>
      {onBack ? (
        <Pressable
          accessibilityRole='button'
          accessibilityLabel='Back'
          hitSlop={12}
          onPress={onBack}
          style={({ pressed }) => [styles.backButton, { opacity: pressed ? 0.6 : 1 }]}
        >
          <ArrowLeftIcon size={20} color={c.colorTextPrimary} />
        </Pressable>
      ) : null}
      <View style={styles.titleGroup}>
        <Text style={[styles.title, { color: c.colorTextPrimary }]} numberOfLines={1}>
          {title}
        </Text>
        {subtitle && <Text style={[styles.subtitle, { color: c.colorTextMuted }]}>{subtitle}</Text>}
      </View>
      <Pressable
        accessibilityRole='button'
        accessibilityLabel='Close'
        hitSlop={12}
        onPress={onClose}
        style={({ pressed }) => [styles.closeButton, { opacity: pressed ? 0.6 : 1 }]}
      >
        <CloseIcon size={20} color={c.colorTextPrimary} />
      </Pressable>
    </View>
  )
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  backButton: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 4
  },
  titleGroup: { flex: 1, marginRight: 8 },
  title: { fontSize: 16, fontWeight: '700' },
  subtitle: { fontSize: 12, marginTop: 2 },
  closeButton: { width: 32, height: 32, alignItems: 'center', justifyContent: 'center' }
})
