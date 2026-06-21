import type { ReactNode } from 'react'
import { Pressable, StyleSheet, View } from 'react-native'
import { useTheme } from '@altersend/components'
import { ChevronRightIcon } from '@altersend/components/icons'
import { Text } from '../ThemedText'

export interface LinkRowProps {
  icon: ReactNode
  label: string
  subtitle?: string
  subtitleTone?: 'muted' | 'success' | 'danger'
  isActive?: boolean
  trailing?: ReactNode
  onPress?: () => void
  isLast?: boolean
}

export function LinkRow({ icon, label, subtitle, subtitleTone = 'muted', isActive, trailing, onPress, isLast }: LinkRowProps) {
  const { theme } = useTheme()
  const c = theme.colors

  const trailingContent = trailing !== undefined
    ? trailing
    : onPress
      ? <ChevronRightIcon size={14} color={c.colorTextMuted} />
      : null

  const subtitleColor = subtitleTone === 'success'
    ? c.colorSuccess
    : subtitleTone === 'danger'
      ? c.colorDanger
      : c.colorTextMuted

  return (
    <>
      <Pressable
        accessibilityRole='button'
        onPress={onPress}
        style={({ pressed }) => [
          styles.row,
          isActive && { backgroundColor: c.colorSurfacePrimary },
          pressed && onPress && { backgroundColor: c.colorSurfacePrimary }
        ]}
      >
        <View style={[styles.iconBox, { backgroundColor: c.colorSurfacePrimary }]}>
          {icon}
        </View>
        <View style={styles.text}>
          <Text style={[styles.label, { color: c.colorTextPrimary }]}>{label}</Text>
          {subtitle ? (
            <Text style={[styles.subtitle, { color: subtitleColor }]} numberOfLines={1}>
              {subtitle}
            </Text>
          ) : null}
        </View>
        {trailingContent}
      </Pressable>
      {!isLast ? (
        <View style={[styles.divider, { backgroundColor: c.colorBorderPrimary }]} />
      ) : null}
    </>
  )
}

export function LinkCard({ children, style }: { children: ReactNode; style?: object }) {
  const { theme } = useTheme()
  return (
    <View
      style={[
        styles.card,
        { backgroundColor: theme.colors.colorBackgroundSubtle, borderColor: theme.colors.colorBorderPrimary },
        style
      ]}
    >
      {children}
    </View>
  )
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden'
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 13
  },
  iconBox: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center'
  },
  text: {
    flex: 1
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    lineHeight: 18
  },
  subtitle: {
    fontSize: 12,
    lineHeight: 16
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    marginLeft: 60
  }
})
