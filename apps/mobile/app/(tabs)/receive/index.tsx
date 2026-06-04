import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { Button } from '@altersend/components'
import { useTranslation } from '@altersend/i18n'
import { useFocusEffect, useRouter } from 'expo-router'
import {
  JOIN_CODE_PATTERN,
  PEER_UNREACHABLE_ERROR_CODE,
  formatFileSize,
  getDownloadTotals,
  getReceiveStep,
  type ReceiveStep,
  useTransferStore
} from '@altersend/domain'
import { clearSession, joinSession } from '@altersend/domain'
import {
  ErrorPanel,
  ReceiveConnectingView,
  ReceiveInterruptedView,
  ReceiveJoinView,
  openCompletedFile
} from '@/src/transfer/receive'
import { Layout } from '@/src/components'

function getDisplayError(t: ReturnType<typeof useTranslation>['t'], message: string | null) {
  if (!message) return null
  return message === PEER_UNREACHABLE_ERROR_CODE ? t('receive:errors.unreachable') : message
}

function getReceivePageCopy(
  t: ReturnType<typeof useTranslation>['t'],
  step: ReceiveStep,
  incomingCount: number,
  totalBytes: number
) {
  switch (step) {
    case 'join':
      return {
        title: t('receive:page.join.title'),
        description: t('receive:page.join.description')
      }
    case 'connecting':
      return {
        title: t('receive:page.connecting.title'),
        description: t('receive:page.connecting.description')
      }
    case 'incoming_transfer':
      return {
        title: t('receive:page.incomingTransfer.title'),
        description: t('receive:page.incomingTransfer.description', {
          count: incomingCount,
          size: formatFileSize(totalBytes)
        })
      }
    case 'completed':
      return {
        title: t('receive:page.completed.title', { count: incomingCount }),
        description: ''
      }
    case 'reconnecting':
      return {
        title: t('receive:page.reconnecting.title'),
        description: t('receive:page.reconnecting.description')
      }
    case 'interrupted':
      return {
        title: t('receive:page.interrupted.title'),
        description: t('receive:page.interrupted.description')
      }
  }
}

export default function ReceiveScreen() {
  const { t } = useTranslation(['receive', 'common'])
  const router = useRouter()
  const errorMessage = useTransferStore((s) => s.errorMessage)
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
    if (!isValidJoinCode) return
    try {
      setIsJoining(true)
      await joinSession(trimmedJoinCode)
    } catch (err) {
      console.warn('ReceiveScreen: joinSession failed', err)
      setIsJoining(false)
    }
  }

  const hasIncomingFiles = incomingFileOffers.length > 0
  const totals = useMemo(
    () => getDownloadTotals(incomingFileOffers, receiveDownloadStates),
    [incomingFileOffers, receiveDownloadStates]
  )
  const allDownloadsCompleted =
    hasIncomingFiles && totals.completedCount === incomingFileOffers.length

  const step = getReceiveStep({
    hasIncomingFiles,
    allDownloadsCompleted,
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

  const totalBytes = incomingFileOffers.reduce((sum, file) => sum + file.size, 0)
  const copy = getReceivePageCopy(t, step, incomingFileOffers.length, totalBytes)
  const title = step === 'join' ? t('receive:page.tabTitle') : copy.title
  const description = step === 'join' ? t('receive:page.join.mobileDescription') : copy.description

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

  const displayError = getDisplayError(t, errorMessage)
  const errorPanel =
    displayError && step !== 'interrupted' ? (
      <ErrorPanel title={t('receive:errors.transferIssue')} message={displayError} />
    ) : null

  if (step === 'join') {
    return (
      <Layout title={title} description={description}>
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
    return (
      <ReceiveConnectingView title={title} description={description} footer={footer}>
        {errorPanel}
      </ReceiveConnectingView>
    )
  }

  if (step === 'interrupted') {
    return (
      <ReceiveInterruptedView
        title={title}
        description={description}
        footer={footer}
        incomingFileOffers={incomingFileOffers}
        downloadStates={receiveDownloadStates}
        onOpenFile={openCompletedFile}
      />
    )
  }

  return (
    <ReceiveConnectingView title={title} description={description} footer={footer}>
      {errorPanel}
    </ReceiveConnectingView>
  )
}
