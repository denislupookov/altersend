import { useCallback, useEffect } from 'react'
import { View, StyleSheet, Pressable } from 'react-native'
import { Paths } from 'expo-file-system'
import { Button, useTheme } from '@altersend/components'
import { DownloadIcon, InfoIcon, PlayIcon } from '@altersend/components/icons'
import { useTranslation } from '@altersend/locales'
import { useRouter } from 'expo-router'
import { uriToPath } from '@/src/api/mobileApi'
import { ConfirmDialog, Layout, IllustrationLayout } from '@/src/components'
import { useLeaveSessionConfirm } from '@/src/hooks/useLeaveSessionConfirm'
import { ReceiveIncomingView, ReceiveReconnectingView } from '@/src/transfer/receive'
import { useErrorToast } from '@/src/transfer/receive/utils/useErrorToast'
import { exitToReceiveTab } from '@/src/transfer/receive/utils/exitToReceiveTab'
import ConnectionLostSvg from '../../../../assets/connection-lost.svg'
import {
  getDisplayError,
  getPrimaryDownloadLabel,
  getReceivePageCopy,
  getReceiveStep,
  useReceiveActions,
  useReceiveDownloads,
  useTransferStore
} from '@altersend/domain'
import { clearSession } from '@altersend/domain'
import { Text } from '@/src/components/ThemedText'

export default function ReceiveIncomingScreen() {
  const { t } = useTranslation(['receive', 'common', 'errors'])
  const { theme } = useTheme()
  const router = useRouter()
  const incomingFileOffers = useTransferStore((s) => s.incomingFileOffers)
  const downloads = useReceiveDownloads()
  const actions = useReceiveActions(downloads)
  const role = useTransferStore((s) => s.role)
  const peerCount = useTransferStore((s) => s.peerCount)
  const connectionType = useTransferStore((s) => s.connectionType)
  const isReconnecting = useTransferStore((s) => s.isReconnecting)
  const errorCode = useTransferStore((s) => s.errorCode)
  const displayError = getDisplayError(t, errorCode)

  useErrorToast(displayError, t('receive:errors.transferIssue'))

  const { totals, fileOffers, allDownloaded } = downloads
  const hasIncomingFiles = incomingFileOffers.length > 0
  const downloadableFileCount = fileOffers.length
  const step = getReceiveStep({
    hasIncomingFiles,
    allDownloadsCompleted: allDownloaded,
    role,
    peerCount,
    isReconnecting
  })

  useEffect(() => {
    if (step === 'completed') {
      router.replace('/receive/complete')
    }
  }, [step, router])

  const handleEndSession = useCallback(() => {
    void clearSession()
    exitToReceiveTab(router)
  }, [router])
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
      if (downloads.primaryAction === 'resume-all') await actions.resumeAll()
      else if (downloads.primaryAction === 'download-all') {
        await actions.downloadInto(uriToPath(Paths.document.uri))
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
      onPress={() => router.push('/connection')}
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
        {t('common:status.connected')}
      </Text>
    </View>
  )

  const renderBody = () => {
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

    if (step !== 'incoming_transfer') {
      return (
        <IllustrationLayout
          title={t('receive:page.sessionEnded.title')}
          description={t('receive:page.sessionEnded.description')}
          hasNativeHeader
          illustration={<ConnectionLostSvg width='100%' height='100%' />}
          aspectRatio={800 / 430}
          footer={
            <Button onClick={handleEndSession} size='lg' variant='primary' width='full'>
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
            {downloads.primaryAction ? (
              <Button
                icon={
                  downloads.primaryAction === 'resume-all' ? (
                    <PlayIcon size={18} />
                  ) : (
                    <DownloadIcon size={18} />
                  )
                }
                loading={downloads.primaryAction === 'downloading'}
                onClick={() => void handlePrimaryAction()}
                size='lg'
                variant='light'
                width='full'
              >
                {getPrimaryDownloadLabel(t, downloads.primaryAction, {
                  percent: totals.percent,
                  totalBytes
                })}
              </Button>
            ) : null}
            {endSessionButton}
          </View>
        }
      >
        <ReceiveIncomingView />
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
