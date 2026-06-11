import React, { PropsWithChildren } from 'react'
import {
  View,
  ScrollView,
  StyleSheet,
  Pressable,
  Platform,
  type DimensionValue
} from 'react-native'
import { useTheme } from '@altersend/components'
import { SettingsIcon } from '@altersend/components/icons'
import { useTranslation } from '@altersend/locales'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Text } from '@/src/components/ThemedText'

interface IllustrationLayoutProps {
  title: string
  description?: string
  footer?: React.ReactElement
  illustration: React.ReactNode
  aspectRatio: number
  width?: DimensionValue
  hasNativeHeader?: boolean
  onMenuPress?: () => void
}

export function IllustrationLayout({
  title,
  description,
  footer,
  illustration,
  aspectRatio,
  width = '75%',
  hasNativeHeader,
  onMenuPress,
  children
}: PropsWithChildren<IllustrationLayoutProps>) {
  const { t } = useTranslation(['common'])
  const { theme } = useTheme()
  const insets = useSafeAreaInsets()

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: theme.colors.colorBackground,
          paddingTop: hasNativeHeader ? 24 : insets.top + 32,
          paddingBottom: Platform.OS === 'ios' ? insets.bottom + 8 : 28
        }
      ]}
    >
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Text style={[styles.title, { color: theme.colors.colorTextPrimary }]}>{title}</Text>
          {onMenuPress ? (
            <Pressable
              accessibilityRole='button'
              accessibilityLabel={t('common:labels.settings')}
              onPress={onMenuPress}
              hitSlop={12}
              style={({ pressed }) => ({ opacity: pressed ? 0.5 : 1 })}
            >
              <SettingsIcon size={22} color={theme.colors.colorTextSecondary} />
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
        <View style={{ width, aspectRatio, alignSelf: 'center', marginBottom: 48 }}>
          {illustration}
        </View>
        {children}
      </ScrollView>

      {footer ? <View style={styles.footer}>{footer}</View> : null}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 20
  },
  header: {
    maxWidth: 720,
    marginBottom: 48
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8
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
    paddingBottom: 8
  },
  footer: {
    gap: 8,
    marginTop: 12
  }
})
