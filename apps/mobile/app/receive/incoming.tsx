import { useCallback, useEffect, useState } from 'react'
import { View, StyleSheet, Pressable } from 'react-native'
import { Paths } from 'expo-file-system'
import { Button, useTheme } from '@altersend/components'
import { DownloadIcon, InfoIcon, PlayIcon } from '@altersend/components/icons'
import { useTranslation } from '@altersend/locales'
import { useRouter } from 'expo-router'
import { uriToPath } from '@/src/api/mobileApi'
import { ConfirmDialog, Layout, IllustrationLayout } from '@/src/components'
import { useToast } from '@/src/components/Toast'
import { lightTap, mediumTap } from '@/src/haptics'
import { useLeaveSessionConfirm } from '@/src/hooks/useLeaveSessionConfirm'
import {
  ReceiveConnectingView,
  ReceiveIncomingView,
  ReceiveInterruptedView,
  ReceiveReconnectingView
} from '@/src/transfer/receive'
import { RelayLimitNote } from '@/src/transfer/receive/views/RelayLimitNote'
import { useErrorToast } from '@/src/transfer/receive/utils/useErrorToast'
import { exitToReceiveTab } from '@/src/transfer/receive/utils/exitToReceiveTab'
import ConnectionLostSvg from '../../../../assets/connection-lost.svg'
import {
  connectedStatusLabel,
  getConnectFailureCode,
  getDisplayError,
  getPrimaryDownloadLabel,
  getReceivePageCopy,
  isSessionOverStep,
  reconnectSession,
  relayPrimaryAction,
  useReceiveActions,
  useReceiveDownloads,
  useReceiveRelayAllowance,
  useRelayUnlocked,
  useReceiveStep,
  useSubscriptionStore,
  useTransferStore
} from '@altersend/domain'
import { clearSession } from '@altersend/domain'
import { Text } from '@/src/components/ThemedText'

export default function ReceiveIncomingScreen() {
  const { t } = useTranslation(['receive', 'common', 'errors', 'settings'])
  const { theme } = useTheme()
  const router = useRouter()
  const incomingFileOffers = useTransferStore((s) => s.incomingFileOffers)
  const downloads = useReceiveDownloads()
  const actions = useReceiveActions(downloads)
  const connectionType = useTransferStore((s) => s.connectionType)
  const errorCode = useTransferStore((s) => s.errorCode)
  const isPro = useSubscriptionStore((s) => s.active)
  const allowance = useReceiveRelayAllowance(downloads)
  const toast = useToast()
  const [reconnecting, setReconnecting] = useState(false)
  const displayError = getDisplayError(t, errorCode)

  const { totals, fileOffers } = downloads
  const downloadableFileCount = fileOffers.length
  const step = useReceiveStep(downloads)

  useErrorToast(isSessionOverStep(step) ? null : displayError, t('receive:errors.transferIssue'))

  useEffect(() => {
    if (step === 'completed') {
      router.replace('/receive/complete')
    }
  }, [step, router])

  useEffect(() => {
    if (!reconnecting) return
    if (step !== 'connecting' && !getConnectFailureCode(step, errorCode)) return
    setReconnecting(false)
    router.replace('/receive/connecting')
  }, [reconnecting, step, errorCode, router])

  useRelayUnlocked(allowance.limited, () =>
    toast.show({ title: t('receive:relayLimit.unlocked'), durationMs: 3000 })
  )

  const reconnect = useCallback(() => {
    setReconnecting(true)
    reconnectSession().catch((err: unknown) => {
      console.warn('ReceiveIncomingScreen: reconnect failed', err)
      setReconnecting(false)
    })
  }, [])

  const getPro = useCallback(() => router.push('/account'), [router])

  const handleExit = useCallback(() => {
    void clearSession()
    exitToReceiveTab(router)
  }, [router])
  const handleEndSession = useCallback(() => {
    mediumTap()
    handleExit()
  }, [handleExit])
  const { leaveDialog } = useLeaveSessionConfirm(handleEndSession)

  const totalBytes = totals.totalBytes
  const textCount = incomingFileOffers.length - downloadableFileCount
  const { title, description } = getReceivePageCopy(
    t,
    step,
    downloadableFileCount,
    textCount,
    totalBytes
  )

  const handlePrimaryAction = async () => {
    try {
      if (downloads.primaryAction === 'resume-all') {
        lightTap()
        await actions.resumeAll()
      } else if (downloads.primaryAction === 'download-all') {
        lightTap()
        await actions.downloadInto(uriToPath(Paths.document.uri), allowance.freePendingOffers)
      }
    } catch (err) {
      console.warn('ReceiveIncomingScreen: download failed', err)
    }
  }

  const isReconnectingStep = step === 'reconnecting'

  const endSessionButton = (
    <Button onClick={handleEndSession} size='lg' variant='secondary' width='full'>
      {t('common:actions.endSession')}
    </Button>
  )

  const isRelay = connectionType === 'relay'
  const badge = isRelay ? (
    <Pressable
      accessibilityRole='button'
      accessibilityLabel={t('common:status.connectedViaRelay')}
      onPress={() => router.push(isPro ? '/connection' : '/account')}
      style={({ pressed }) => [
        styles.badge,
        { backgroundColor: theme.colors.colorSuccessSubtle, opacity: pressed ? 0.7 : 1 }
      ]}
    >
      <View style={[styles.badgeDot, { backgroundColor: theme.colors.colorSuccess }]} />
      <Text style={[styles.badgeText, { color: theme.colors.colorSuccess }]}>
        {t('common:status.connectedViaRelay')}
      </Text>
      <InfoIcon size={13} color={theme.colors.colorSuccess} />
    </Pressable>
  ) : (
    <View style={[styles.badge, { backgroundColor: theme.colors.colorSuccessSubtle }]}>
      <View style={[styles.badgeDot, { backgroundColor: theme.colors.colorSuccess }]} />
      <Text style={[styles.badgeText, { color: theme.colors.colorSuccess }]}>
        {connectedStatusLabel(t, connectionType)}
      </Text>
    </View>
  )

  const renderPrimary = () => {
    const action = downloads.primaryAction
    if (!action) return null

    const relayAction = relayPrimaryAction(t, action, allowance)
    const label =
      relayAction?.label ??
      getPrimaryDownloadLabel(t, action, { percent: totals.percent, totalBytes })

    return (
      <Button
        disabled={relayAction?.disabled}
        icon={action === 'resume-all' ? <PlayIcon size={18} /> : <DownloadIcon size={18} />}
        loading={action === 'downloading'}
        onClick={handlePrimaryAction}
        size='lg'
        variant='light'
        width='full'
      >
        {label}
      </Button>
    )
  }

  const renderBody = () => {
    if (reconnecting) {
      return <ReceiveConnectingView />
    }

    if (isReconnectingStep) {
      return (
        <ReceiveReconnectingView
          title={title}
          description={description}
          footer={endSessionButton}
          hasNativeHeader
        />
      )
    }

    if (step === 'completed') {
      return null
    }

    if (isSessionOverStep(step)) {
      return (
        <ReceiveInterruptedView
          title={title}
          description={description}
          hasNativeHeader
          footer={
            <Button onClick={handleExit} size='lg' variant='primary' width='full'>
              {t('receive:actions.backToHome')}
            </Button>
          }
        />
      )
    }

    if (step !== 'incoming_transfer') {
      return (
        <IllustrationLayout
          title={t('receive:page.sessionEnded.title')}
          description={t('receive:page.sessionEnded.description')}
          hasNativeHeader
          illustration={<ConnectionLostSvg width='100%' height='100%' />}
          aspectRatio={800 / 430}
          footer={
            <Button onClick={handleExit} size='lg' variant='primary' width='full'>
              {t('receive:actions.backToHome')}
            </Button>
          }
        />
      )
    }

    return (
      <Layout
        title={title}
        description={description}
        badge={badge}
        hasNativeHeader
        footer={
          <View style={styles.footerStack}>
            {renderPrimary()}
            {endSessionButton}
          </View>
        }
      >
        <ReceiveIncomingView
          rows={allowance.rows}
          lockedKeys={allowance.lockedKeys}
          rowsFooter={
            allowance.limited ? (
              <RelayLimitNote onGetPro={getPro} onTryAgain={reconnect} />
            ) : undefined
          }
        />
      </Layout>
    )
  }

  return (
    <>
      {renderBody()}
      <ConfirmDialog {...leaveDialog} />
    </>
  )
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 6,
    borderRadius: 100,
    paddingHorizontal: 10,
    paddingVertical: 4
  },
  badgeDot: {
    width: 8,
    height: 8,
    borderRadius: 4
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600'
  },
  footerStack: {
    gap: 8,
    width: '100%'
  }
})
