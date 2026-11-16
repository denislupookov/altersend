import { useEffect, useRef } from 'react'
import { useNavigation, useRouter } from 'expo-router'
import {
  clearSession,
  getConnectFailureCode,
  useReceiveDownloads,
  useReceiveStep,
  useTransferStore
} from '@altersend/domain'
import { ReceiveConnectFailureView, ReceiveConnectingView } from '@/src/transfer/receive'
import { exitToReceiveTab } from '@/src/transfer/receive/utils/exitToReceiveTab'
import { USER_BACK_ACTIONS } from '@/src/hooks/useLeaveSessionConfirm'

export default function ReceiveConnectingScreen() {
  const router = useRouter()
  const navigation = useNavigation()
  const leavingRef = useRef(false)
  const errorCode = useTransferStore((s) => s.errorCode)
  const step = useReceiveStep(useReceiveDownloads())
  const failureCode = getConnectFailureCode(step, errorCode)

  useEffect(
    () =>
      navigation.addListener('beforeRemove', ({ data }) => {
        if (!USER_BACK_ACTIONS.has(data.action.type)) return
        leavingRef.current = true
        clearSession()
      }),
    [navigation]
  )

  useEffect(() => {
    if (leavingRef.current || step === 'connecting' || failureCode) return
    if (step === 'join') {
      exitToReceiveTab(router)
      return
    }
    router.replace('/receive/incoming')
  }, [step, failureCode, router])

  if (failureCode) {
    return <ReceiveConnectFailureView code={failureCode} />
  }

  return <ReceiveConnectingView />
}
