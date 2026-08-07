import { useCallback, useEffect } from 'react'
import { getSendStep, isShareStep, useTransferStore } from '@altersend/domain'
import { clearSenderFlow } from '@altersend/domain'
import { ConfirmDialog, Layout } from '@/src/components'
import { useLeaveSessionConfirm } from '@/src/hooks/useLeaveSessionConfirm'
import { PreparingView } from '@/src/transfer/send'
import { useRouter } from 'expo-router'

export default function SendPreparingScreen() {
  const draftPhase = useTransferStore((s) => s.draftPhase)
  const connectionState = useTransferStore((s) => s.connectionState)
  const step = getSendStep({ draftPhase, isPeerConnected: connectionState === 'peer-connected' })
  const router = useRouter()

  useEffect(() => {
    if (isShareStep(step)) router.replace('/send/share')
  }, [step, router])

  const handleBack = useCallback(() => {
    clearSenderFlow()
  }, [])
  const { leaveDialog } = useLeaveSessionConfirm(handleBack)

  return (
    <Layout hasNativeHeader>
      <PreparingView />
      <ConfirmDialog {...leaveDialog} />
    </Layout>
  )
}
