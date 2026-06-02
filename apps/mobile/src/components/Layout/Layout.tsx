import { useTheme } from '@altersend/components'
import { SettingsIcon } from '@altersend/components/icons'
import { BlurView } from 'expo-blur'
import { PropsWithChildren } from 'react'
import { View, Text, StyleSheet, ScrollView, Pressable, Platform } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

interface LayoutProps {
  title: string
  description: string
  badge?: React.ReactElement
  footer?: React.ReactElement
  hasNativeHeader?: boolean
  compactHeader?: boolean
  onMenuPress?: () => void
}

export const Layout = ({
  title,
  description,
  badge,
  footer,
  children,
  hasNativeHeader,
  compactHeader,
  onMenuPress
}: PropsWithChildren<LayoutProps>) => {
  const { theme } = useTheme()
  const insets = useSafeAreaInsets()

  const paddingTop = hasNativeHeader ? 8 : insets.top + 32
  const paddingBottom = Platform.OS === 'ios' ? insets.bottom + 8 : 28

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: theme.colors.colorBackground,
          paddingTop,
          paddingBottom
        }
      ]}
    >
      <View style={[styles.header, compactHeader && styles.headerCompact]}>
        {badge ? <View style={styles.badgeSlot}>{badge}</View> : null}
        <View style={styles.titleRow}>
          <Text style={[styles.title, { color: theme.colors.colorTextPrimary }]}>{title}</Text>
          {onMenuPress ? (
            <Pressable
              accessibilityRole='button'
              accessibilityLabel='Settings'
              onPress={onMenuPress}
              hitSlop={12}
              style={({ pressed }) => [styles.menuButton, { opacity: pressed ? 0.6 : 1 }]}
            >
              {Platform.OS === 'ios' ? (
                <BlurView
                  pointerEvents='none'
                  intensity={30}
                  tint='systemUltraThinMaterialDark'
                  style={StyleSheet.absoluteFill}
                />
              ) : null}
              <View
                style={[styles.menuButtonBorder, { borderColor: theme.colors.colorBorderPrimary }]}
              />
              <SettingsIcon size={20} color={theme.colors.colorTextPrimary} />
            </Pressable>
          ) : null}
        </View>
        {description ? (
          <Text style={[styles.description, { color: theme.colors.colorTextSecondary }]}>
            {description}
          </Text>
        ) : null}
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {children}
        {footer && <View style={styles.spacer} />}
        {footer && <View style={styles.footer}>{footer}</View>}
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 20
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8
  },
  header: {
    maxWidth: 720,
    marginBottom: 24
  },
  headerCompact: {
    marginBottom: 4
  },
  badgeSlot: {
    alignSelf: 'flex-start',
    marginBottom: 12
  },
  title: {
    fontSize: 30,
    fontWeight: '700',
    letterSpacing: -0.5,
    flex: 1
  },
  menuButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden'
  },
  menuButtonBorder: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 18,
    borderWidth: StyleSheet.hairlineWidth
  },
  description: {
    fontSize: 15,
    lineHeight: 22
  },
  scrollView: {
    flex: 1
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 8
  },
  spacer: {
    flex: 1
  },
  footer: {
    gap: 8,
    marginTop: 12
  }
})
