import { useTheme } from '@altersend/components'
import { useTranslation } from '@altersend/locales'
import { PropsWithChildren } from 'react'
import { View, StyleSheet, ScrollView, Platform } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { IconButton } from '@/src/components/IconButton'
import { Text } from '@/src/components/ThemedText'

interface LayoutProps {
  title?: string
  description?: string
  backdrop?: React.ReactElement
  badge?: React.ReactElement
  footer?: React.ReactElement
  hasNativeHeader?: boolean
  compactHeader?: boolean
  compactTop?: boolean
  noScroll?: boolean
  onMenuPress?: () => void
}

const SCREEN_PADDING = 16

export const Layout = ({
  title,
  description,
  backdrop,
  badge,
  footer,
  children,
  hasNativeHeader,
  compactHeader,
  compactTop,
  noScroll,
  onMenuPress
}: PropsWithChildren<LayoutProps>) => {
  const { t } = useTranslation(['common'])
  const { theme } = useTheme()
  const insets = useSafeAreaInsets()

  const showHeader = Boolean(title || description || badge || onMenuPress)

  const resolvePaddingTop = () => {
    if (hasNativeHeader) return showHeader ? 8 : 24
    if (compactTop) return insets.top + 8
    return insets.top + 32
  }

  const paddingTop = resolvePaddingTop()
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
      {backdrop ? (
        <View pointerEvents='none' style={styles.backdrop}>
          {backdrop}
        </View>
      ) : null}

      {showHeader ? (
        <View style={[styles.header, compactHeader && styles.headerCompact]}>
          {badge ? <View style={styles.badgeSlot}>{badge}</View> : null}
          <View style={styles.titleRow}>
            <Text style={[styles.title, { color: theme.colors.colorTextPrimary }]}>{title}</Text>
            {onMenuPress ? (
              <IconButton
                icon='settings'
                label={t('common:labels.settings')}
                onPress={onMenuPress}
              />
            ) : null}
          </View>
          {description ? (
            <Text style={[styles.description, { color: theme.colors.colorTextSecondary }]}>
              {description}
            </Text>
          ) : null}
        </View>
      ) : null}

      {noScroll ? (
        <View style={[styles.scrollView, styles.scrollContent]}>{children}</View>
      ) : (
        <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
          {children}
        </ScrollView>
      )}
      {footer ? <View style={styles.footer}>{footer}</View> : null}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8
  },
  header: {
    maxWidth: 720,
    marginBottom: 24,
    paddingHorizontal: SCREEN_PADDING
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
  description: {
    fontSize: 15,
    lineHeight: 22
  },
  scrollView: {
    flex: 1
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 8,
    paddingHorizontal: SCREEN_PADDING
  },
  footer: {
    gap: 8,
    paddingTop: 12,
    paddingHorizontal: SCREEN_PADDING
  }
})
