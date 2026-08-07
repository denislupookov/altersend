import React, { useCallback, useEffect, useMemo, useState } from 'react'
import * as Haptics from 'expo-haptics'
import { Button } from '@altersend/components'
import { useTranslation } from '@altersend/locales'
import { useFocusEffect, useRouter } from 'expo-router'
import {
  JOIN_CODE_PATTERN,
  getDisplayError,
  getReceivePageCopy,
  getReceiveStep,
  useReceiveDownloads,
  useTransferStore
} from '@altersend/domain'
import { clearSession, joinSession } from '@altersend/domain'
import {
  ReceiveConnectingView,
  ReceiveInterruptedView,
  ReceiveJoinView,
  openCompletedFile
} from '@/src/transfer/receive'
import { useErrorToast } from '@/src/transfer/receive/utils/useErrorToast'
import { Layout } from '@/src/components'

export default function ReceiveScreen() {
  const { t } = useTranslation(['receive', 'common', 'errors'])
  const router = useRouter()
  const errorCode = useTransferStore((s) => s.errorCode)
  const role = useTransferStore((s) => s.role)
  const isReconnecting = useTransferStore((s) => s.isReconnecting)
  const incomingFileOffers = useTransferStore((s) => s.incomingFileOffers)
  const peerCount = useTransferStore((s) => s.peerCount)
  const receiveDownloadStates = useTransferStore((s) => s.receiveDownloadStates)

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
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {})
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

  const { totals, fileOffers, textOffers, allDownloaded } = useReceiveDownloads()
  const downloadableFileCount = fileOffers.length

  const step = getReceiveStep({
    hasIncomingFiles: downloadableFileCount + textOffers.length > 0,
    allDownloadsCompleted: allDownloaded,
    role,
    peerCount,
    isReconnecting
  })

  useFocusEffect(
    useCallback(() => {
      if (step === 'incoming_transfer') {
        router.push('/receive/incoming')
      }
    }, [step, router])
  )

  useEffect(() => {
    if (step === 'join') {
      setJoinCode('')
      setShowValidation(false)
      setIsJoining(false)
    }
  }, [step])

  const textCount = incomingFileOffers.length - downloadableFileCount
  const copy = getReceivePageCopy(t, step, downloadableFileCount, textCount, totals.totalBytes)
  const title = step === 'join' ? t('receive:page.tabTitle') : copy.title

  const footer =
    step === 'join' ? undefined : (
      <Button
        onClick={clearSession}
        size='lg'
        variant={step === 'interrupted' ? 'primary' : 'secondary'}
        width='full'
      >
        {step === 'interrupted' ? t('common:actions.done') : t('common:actions.endSession')}
      </Button>
    )

  const displayError = getDisplayError(t, errorCode)
  useErrorToast(step === 'interrupted' ? null : displayError, t('receive:errors.transferIssue'))

  if (step === 'join') {
    return (
      <Layout title={title}>
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

  if (step === 'connecting') {
    return <ReceiveConnectingView title={title} description={copy.description} footer={footer} />
  }

  if (step === 'interrupted') {
    return (
      <ReceiveInterruptedView
        title={title}
        description={copy.description}
        footer={footer}
        incomingFileOffers={incomingFileOffers}
        downloadStates={receiveDownloadStates}
        onOpenFile={openCompletedFile}
      />
    )
  }

  return <ReceiveConnectingView title={title} description={copy.description} footer={footer} />
}
