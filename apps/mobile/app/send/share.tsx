import { useCallback } from 'react'
import { Platform, View } from 'react-native'
import { Button } from '@altersend/components'
import { clearSenderFlow, getSendPageCopy, getSendStep, useTransferStore } from '@altersend/domain'
import { useTranslation } from '@altersend/locales'
import { ConfirmDialog, Layout } from '@/src/components'
import { useLeaveSessionConfirm } from '@/src/hooks/useLeaveSessionConfirm'
import { ShareView } from '@/src/transfer/send'

const IOS_CONTINUED_TASK_VERSION = 26

const sustainsBackgroundTransfer =
  Platform.OS !== 'ios' ||
  Number.parseInt(String(Platform.Version), 10) >= IOS_CONTINUED_TASK_VERSION

export default function SendShareScreen() {
  const { t } = useTranslation(['send', 'common'])
  const draftPhase = useTransferStore((s) => s.draftPhase)
  const connectionState = useTransferStore((s) => s.connectionState)
  const step = getSendStep({ draftPhase, isPeerConnected: connectionState === 'peer-connected' })
  const copy = getSendPageCopy(t, step)
  const needsStayHint = step === 'receiver_connected' && !sustainsBackgroundTransfer

  const handleBack = useCallback(() => {
    clearSenderFlow()
  }, [])
  const { leaveDialog } = useLeaveSessionConfirm(handleBack)

  return (
    <Layout
      title={copy.title}
      description={needsStayHint ? t('send:hints.stayUntilDone') : copy.description}
      hasNativeHeader
      noScroll
      footer={
        <View style={{ marginBottom: Platform.OS === 'android' ? 20 : 0 }}>
          <Button onClick={clearSenderFlow} size='lg' variant='secondary' width='full'>
            {t('common:actions.endSession')}
          </Button>
        </View>
      }
    >
      <ShareView />
      <ConfirmDialog {...leaveDialog} />
    </Layout>
  )
}
