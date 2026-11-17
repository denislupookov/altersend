import React, { PropsWithChildren, useEffect } from 'react'
import { useTranslation } from '@altersend/locales'
import { Layout } from '@/src/components'
import { errorTap } from '@/src/haptics'
import { ReceiveIncomingView } from './ReceiveIncomingView'

interface ReceiveInterruptedViewProps {
  title: string
  description: string
  footer?: React.ReactElement
  onMenuPress?: () => void
  hasNativeHeader?: boolean
}

export function ReceiveInterruptedView({
  title,
  description,
  footer,
  onMenuPress,
  hasNativeHeader,
  children
}: PropsWithChildren<ReceiveInterruptedViewProps>) {
  const { t } = useTranslation(['receive', 'common'])

  useEffect(() => {
    errorTap()
  }, [])

  return (
    <Layout
      title={title}
      description={description}
      footer={footer}
      onMenuPress={onMenuPress}
      hasNativeHeader={hasNativeHeader}
    >
      <ReceiveIncomingView hideFilesTitle pendingLabel={t('receive:errors.didntArrive')} />
      {children}
    </Layout>
  )
}
