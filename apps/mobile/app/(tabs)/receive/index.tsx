import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { Button } from '@altersend/components'
import { useTranslation } from '@altersend/locales'
import { useFocusEffect, useRouter } from 'expo-router'
import {
  JOIN_CODE_PATTERN,
  getDisplayError,
  getConnectFailureCode,
  getReceivePageCopy,
  isConnectFailure,
  isSessionOverStep,
  useReceiveDownloads,
  useReceiveStep,
  useTransferStore
} from '@altersend/domain'
import { clearSession, joinSession } from '@altersend/domain'
import { ReceiveInterruptedView, ReceiveJoinView } from '@/src/transfer/receive'
import { useErrorToast } from '@/src/transfer/receive/utils/useErrorToast'
import { errorTap } from '@/src/haptics'
import { Layout } from '@/src/components'

export default function ReceiveScreen() {
  const { t } = useTranslation(['receive', 'common', 'errors'])
  const router = useRouter()
  const errorCode = useTransferStore((s) => s.errorCode)
  const role = useTransferStore((s) => s.role)

  const [joinCode, setJoinCode] = useState('')
  const [showValidation, setShowValidation] = useState(false)
  const [isJoining, setIsJoining] = useState(false)

  const trimmedJoinCode = joinCode.trim()
  const isValidJoinCode = JOIN_CODE_PATTERN.test(trimmedJoinCode)

  const joinCodeError = useMemo(() => {
    if (!showValidation || isValidJoinCode || trimmedJoinCode.length === 0) {
      return undefined
    }
    return t('receive:errors.invalidCode')
  }, [isValidJoinCode, showValidation, t, trimmedJoinCode.length])

  const handleJoinCodeChange = (value: string) => {
    setJoinCode(value)
    if (showValidation) setShowValidation(false)
  }

  const submitJoin = async () => {
    if (isJoining || role !== null) return
    setShowValidation(true)
    if (!isValidJoinCode) {
      if (trimmedJoinCode.length > 0) {
        errorTap()
      }
      return
    }
    try {
      setIsJoining(true)
      await joinSession(trimmedJoinCode)
    } catch (err) {
      console.warn('ReceiveScreen: joinSession failed', err)
      setIsJoining(false)
    }
  }

  const downloads = useReceiveDownloads()
  const step = useReceiveStep(downloads)
  const { totals, fileOffers, textOffers } = downloads
  const connectFailure = getConnectFailureCode(step, errorCode) !== null

  useFocusEffect(
    useCallback(() => {
      if (step === 'incoming_transfer') {
        router.push('/receive/incoming')
        return
      }
      if (step === 'connecting' || connectFailure) {
        router.push('/receive/connecting')
      }
    }, [step, connectFailure, router])
  )

  useEffect(() => {
    if (step === 'join') {
      setJoinCode('')
      setShowValidation(false)
      setIsJoining(false)
    }
  }, [step])

  const copy = getReceivePageCopy(t, step, fileOffers.length, textOffers.length, totals.totalBytes)
  const isSessionOver = isSessionOverStep(step)

  const displayError = getDisplayError(t, errorCode)
  useErrorToast(
    isSessionOver || isConnectFailure(errorCode) ? null : displayError,
    t('receive:errors.transferIssue')
  )

  if (isSessionOver) {
    return (
      <ReceiveInterruptedView
        title={copy.title}
        description={copy.description}
        footer={
          <Button onClick={clearSession} size='lg' variant='primary' width='full'>
            {t('common:actions.done')}
          </Button>
        }
      />
    )
  }

  return (
    <Layout title={t('receive:page.tabTitle')}>
      <ReceiveJoinView
        joinCode={joinCode}
        onJoinCodeChange={handleJoinCodeChange}
        joinCodeError={joinCodeError}
        isLoading={isJoining}
        onConnect={() => void submitJoin()}
        onScanQr={() => router.push('/receive/scan')}
      />
    </Layout>
  )
}
