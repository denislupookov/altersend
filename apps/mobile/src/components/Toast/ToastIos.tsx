import React from 'react'
import { Animated, Pressable, StyleSheet, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useTheme } from '@altersend/components'
import { CheckIcon } from '@altersend/components/icons'
import { Text } from '@/src/components/ThemedText'

interface ToastIosProps {
  title: string
  hint?: string
  translate: Animated.Value
  opacity: Animated.Value
  onPress: () => void
}

export function ToastIos({ title, hint, translate, opacity, onPress }: ToastIosProps) {
  const { theme } = useTheme()
  const insets = useSafeAreaInsets()

  return (
    <Animated.View
      pointerEvents='box-none'
      style={[
        styles.container,
        { top: insets.top + 8, opacity, transform: [{ translateY: translate }] }
      ]}
    >
      <Pressable
        onPress={onPress}
        style={[
          styles.pill,
          {
            backgroundColor: theme.colors.colorSurfaceSecondary,
            borderColor: theme.colors.colorBorderPrimary,
            shadowColor: theme.colors.colorScrim
          }
        ]}
      >
        <View style={[styles.icon, { backgroundColor: theme.colors.colorSuccess }]}>
          <CheckIcon size={14} color={theme.colors.colorTextPrimary} />
        </View>
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
      </Pressable>
    </Animated.View>
  )
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 16,
    right: 16,
    alignItems: 'center'
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 999,
    borderWidth: 1,
    maxWidth: '100%',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.18,
    shadowRadius: 16,
    elevation: 8
  },
  icon: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center'
  },
  textBlock: {
    flexShrink: 1
  },
  title: {
    fontSize: 14,
    fontWeight: '600'
  },
  hint: {
    fontSize: 12,
    marginTop: 1
  }
})
