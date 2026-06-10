import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { Button } from '@altersend/components'
import { useFocusEffect, useRouter } from 'expo-router'
import {
  JOIN_CODE_PATTERN,
  getDownloadTotals,
  getReceivePageCopy,
  getReceiveStep,
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

export default function ReceiveScreen() {
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
    return 'Enter a valid 64-character hex code.'
  }, [isValidJoinCode, showValidation, trimmedJoinCode.length])

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

  const copy = getReceivePageCopy(step, incomingFileOffers.length)
  const title = step === 'join' ? 'Receive' : copy.title
  const description =
    step === 'join'
      ? "Scan or import a sender's QR, or paste their 64-character code to start streaming."
      : copy.description

  const footer =
    step === 'join' ? undefined : (
      <Button
        onClick={clearSession}
        size='lg'
        variant={step === 'interrupted' ? 'primary' : 'secondary'}
        width='full'
      >
        {step === 'interrupted' ? 'Done' : 'End session'}
      </Button>
    )

  const errorPanel =
    errorMessage && step !== 'interrupted' ? <ErrorPanel message={errorMessage} /> : null

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
