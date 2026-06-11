import React, { PropsWithChildren } from 'react'
import { View, ActivityIndicator, StyleSheet } from 'react-native'
import { useTheme } from '@altersend/components'
import { useTranslation } from '@altersend/locales'
import { IllustrationLayout } from '@/src/components'
import ConnectingSvg from '../../../../../../assets/connecting.svg'
import { Text } from '@/src/components/ThemedText'

interface ReceiveConnectingViewProps {
  title: string
  description: string
  footer?: React.ReactElement
  onMenuPress?: () => void
}

export function ReceiveConnectingView({
  title,
  description,
  footer,
  onMenuPress,
  children
}: PropsWithChildren<ReceiveConnectingViewProps>) {
  const { t } = useTranslation(['receive'])
  const { theme } = useTheme()

  return (
    <IllustrationLayout
      title={title}
      description={description}
      footer={footer}
      onMenuPress={onMenuPress}
      illustration={<ConnectingSvg width='100%' height='100%' />}
      aspectRatio={960 / 418.531}
    >
      <View
        style={[
          styles.panel,
          {
            backgroundColor: theme.colors.colorBackgroundSubtle,
            borderColor: theme.colors.colorBorderPrimary
          }
        ]}
      >
        <View style={styles.content}>
          <ActivityIndicator color={theme.colors.colorAccent} size='small' />
          <View style={styles.textWrap}>
            <Text style={[styles.title, { color: theme.colors.colorTextPrimary }]}>
              {t('receive:page.handshake.title')}
            </Text>
            <Text style={[styles.description, { color: theme.colors.colorTextSecondary }]}>
              {t('receive:page.handshake.description')}
            </Text>
          </View>
        </View>
      </View>
      {children}
    </IllustrationLayout>
  )
}

const styles = StyleSheet.create({
  panel: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 18
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12
  },
  textWrap: {
    flex: 1,
    gap: 4
  },
  title: {
    fontSize: 15,
    fontWeight: '600'
  },
  description: {
    fontSize: 14,
    lineHeight: 20
  }
})
