import React, { PropsWithChildren } from 'react'
import { StyleSheet, View, type DimensionValue } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { StatusState, useTheme } from '@altersend/components'
import type { ConnectStatus } from '@altersend/domain'

interface ReceiveStatusViewProps {
  status: ConnectStatus
  illustration: React.ReactNode
  aspectRatio: number
  illustrationWidth: DimensionValue
  footer?: React.ReactElement
}

export function ReceiveStatusView({
  status,
  illustration,
  aspectRatio,
  illustrationWidth,
  footer,
  children
}: PropsWithChildren<ReceiveStatusViewProps>) {
  const { theme } = useTheme()
  const insets = useSafeAreaInsets()

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: theme.colors.colorBackground,
          paddingBottom: insets.bottom + 8
        }
      ]}
    >
      <View style={styles.body}>
        <View style={{ width: illustrationWidth, aspectRatio }}>{illustration}</View>
        <StatusState {...status}>{children}</StatusState>
      </View>

      {footer ? <View style={styles.footer}>{footer}</View> : null}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1
  },
  body: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 40,
    paddingHorizontal: 24
  },
  footer: {
    gap: 6,
    paddingTop: 12,
    paddingHorizontal: 16
  }
})
