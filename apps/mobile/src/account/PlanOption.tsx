import { useTheme } from '@altersend/components'
import type { PlanRow } from '@altersend/domain'
import { Pressable, StyleSheet } from 'react-native'
import { Text } from '@/src/components/ThemedText'

interface PlanOptionProps {
  row: PlanRow
  selected: boolean
  onPress: () => void
}

export function PlanOption({ row, selected, onPress }: PlanOptionProps) {
  const { theme } = useTheme()
  const c = theme.colors

  return (
    <Pressable
      accessibilityRole='radio'
      accessibilityState={{ checked: selected }}
      onPress={onPress}
      style={[
        styles.card,
        {
          backgroundColor: c.colorBackgroundSubtle,
          borderColor: selected ? c.colorTextPrimary : c.colorBorderPrimary,
          borderWidth: selected ? 2 : 1,
          padding: selected ? 13 : 14
        }
      ]}
    >
      <Text style={[styles.name, { color: c.colorTextMuted }]}>{row.title}</Text>
      {row.price ? (
        <Text style={[styles.price, { color: c.colorTextPrimary }]}>{row.price}</Text>
      ) : null}
      <Text style={[styles.caption, { color: c.colorTextMuted }]}>{row.caption}</Text>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    borderRadius: 16,
    gap: 2
  },
  name: { fontSize: 13, fontWeight: '600' },
  price: { fontSize: 20, fontWeight: '700', letterSpacing: -0.4, marginTop: 2 },
  caption: { fontSize: 12 }
})
