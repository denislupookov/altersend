import { StyleSheet, View } from 'react-native'
import { useTheme, withAlpha } from '@altersend/components'
import { Text } from '@/src/components/ThemedText'

interface ErrorPanelProps {
  title: string
  message: string
}

export function ErrorPanel({ title, message }: ErrorPanelProps) {
  const { theme } = useTheme()
  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: withAlpha(theme.colors.colorDanger, 0.12),
          borderColor: withAlpha(theme.colors.colorDanger, 0.24)
        }
      ]}
    >
      <Text style={[styles.title, { color: theme.colors.colorDanger }]}>{title}</Text>
      <Text style={[styles.text, { color: theme.colors.colorDanger }]}>{message}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 18,
    gap: 4
  },
  title: {
    fontSize: 14,
    fontWeight: '600'
  },
  text: {
    fontSize: 13,
    lineHeight: 18
  }
})
