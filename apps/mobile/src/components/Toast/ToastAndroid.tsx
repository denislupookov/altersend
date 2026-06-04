import React from 'react'
import { Animated, Pressable, StyleSheet, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useTheme } from '@altersend/components'
import { Text } from '@/src/components/ThemedText'

interface ToastAndroidProps {
  title: string
  hint?: string
  actionLabel?: string
  translate: Animated.Value
  opacity: Animated.Value
  onPress: () => void
}

export function ToastAndroid({
  title,
  hint,
  actionLabel,
  translate,
  opacity,
  onPress
}: ToastAndroidProps) {
  const { theme } = useTheme()
  const insets = useSafeAreaInsets()

  return (
    <Animated.View
      pointerEvents='box-none'
      style={[
        styles.container,
        { bottom: insets.bottom + 80, opacity, transform: [{ translateY: translate }] }
      ]}
    >
      <View
        style={[
          styles.bar,
          {
            backgroundColor: theme.colors.colorSurfaceSecondary,
            borderColor: theme.colors.colorBorderPrimary,
            shadowColor: theme.colors.colorScrim
          }
        ]}
      >
        <View style={styles.textBlock}>
          <Text numberOfLines={1} style={[styles.title, { color: theme.colors.colorTextPrimary }]}>
            {title}
          </Text>
          {hint ? (
            <Text
              numberOfLines={1}
              style={[styles.hint, { color: theme.colors.colorTextSecondary }]}
            >
              {hint}
            </Text>
          ) : null}
        </View>
        {actionLabel ? (
          <Pressable onPress={onPress} style={styles.action} hitSlop={8}>
            <Text style={[styles.actionText, { color: theme.colors.colorSuccess }]}>
              {actionLabel.toUpperCase()}
            </Text>
          </Pressable>
        ) : null}
      </View>
    </Animated.View>
  )
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 16,
    right: 16
  },
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 6
  },
  textBlock: {
    flex: 1,
    minWidth: 0
  },
  title: {
    fontSize: 14,
    fontWeight: '500'
  },
  hint: {
    fontSize: 12,
    marginTop: 2
  },
  action: {
    paddingHorizontal: 8,
    paddingVertical: 4
  },
  actionText: {
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.5
  }
})
