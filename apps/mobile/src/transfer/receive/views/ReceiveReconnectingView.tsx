import React, { PropsWithChildren } from 'react'
import { ActivityIndicator } from 'react-native'
import { useTheme } from '@altersend/components'
import { useTranslation } from '@altersend/locales'
import { Layout } from '@/src/components'
import { ReceiveIncomingView } from './ReceiveIncomingView'

interface ReceiveReconnectingViewProps {
  title: string
  description: string
  footer?: React.ReactElement
  hasNativeHeader?: boolean
}

export function ReceiveReconnectingView({
  title,
  description,
  footer,
  hasNativeHeader,
  children
}: PropsWithChildren<ReceiveReconnectingViewProps>) {
  const { t } = useTranslation(['receive'])
  const { theme } = useTheme()

  return (
    <Layout
      title={title}
      description={description}
      footer={footer}
      hasNativeHeader={hasNativeHeader}
      titleAccessory={<ActivityIndicator color={theme.colors.colorAccent} size='small' />}
    >
      <ReceiveIncomingView hideFilesTitle pendingLabel={t('receive:status.waiting')} />
      {children}
    </Layout>
  )
}
