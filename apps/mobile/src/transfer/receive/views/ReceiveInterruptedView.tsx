import React, { PropsWithChildren, useEffect } from 'react'
import { useTranslation } from '@altersend/locales'
import { IllustrationLayout } from '@/src/components'
import { errorTap } from '@/src/haptics'
import { ReceiveIncomingView } from './ReceiveIncomingView'
import MissingFilesSvg from '../../../../../../assets/missing-files.svg'

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
    <IllustrationLayout
      title={title}
      description={description}
      footer={footer}
      onMenuPress={onMenuPress}
      hasNativeHeader={hasNativeHeader}
      illustration={<MissingFilesSvg width='100%' height='100%' />}
      aspectRatio={1009 / 880}
      width='70%'
    >
      <ReceiveIncomingView hideFilesTitle pendingLabel={t('receive:errors.didntArrive')} />
      {children}
    </IllustrationLayout>
  )
}
