import { useCallback, useEffect, useMemo } from 'react'
import { View, StyleSheet, Pressable } from 'react-native'
import { Paths } from 'expo-file-system'
import { Button, useTheme, withAlpha } from '@altersend/components'
import { ArrowLeftIcon, DownloadIcon } from '@altersend/components/icons'
import { useTranslation } from '@altersend/locales'
import { useNavigation, useRouter } from 'expo-router'
import { uriToPath } from '@/src/api/mobileApi'
import { Layout, IllustrationLayout } from '@/src/components'
import { ErrorPanel, ReceiveIncomingView, ReceiveReconnectingView } from '@/src/transfer/receive'
import ConnectionLostSvg from '../../../../assets/connection-lost.svg'
import {
  createDirectoryDownloadRequests,
  formatFileSize,
  getDisplayError,
  getDownloadTotals,
  getReceivePageCopy,
  getReceiveStep,
  useTransferStore
} from '@altersend/domain'
import { clearSession, downloadFiles } from '@altersend/domain'
import { Text } from '@/src/components/ThemedText'

export default function ReceiveIncomingScreen() {
  const { t } = useTranslation(['receive', 'common', 'errors'])
  const { theme } = useTheme()
  const navigation = useNavigation()
  const router = useRouter()
  const incomingFileOffers = useTransferStore((s) => s.incomingFileOffers)
  const receiveDownloadStates = useTransferStore((s) => s.receiveDownloadStates)
  const role = useTransferStore((s) => s.role)
  const peerCount = useTransferStore((s) => s.peerCount)
  const isReconnecting = useTransferStore((s) => s.isReconnecting)
  const errorCode = useTransferStore((s) => s.errorCode)
  const displayError = getDisplayError(t, errorCode)

  const totals = useMemo(
    () => getDownloadTotals(incomingFileOffers, receiveDownloadStates),
    [incomingFileOffers, receiveDownloadStates]
  )

  const hasIncomingFiles = incomingFileOffers.length > 0
  const allDownloadsCompleted =
    hasIncomingFiles && totals.completedCount === incomingFileOffers.length
  const step = getReceiveStep({
    hasIncomingFiles,
    allDownloadsCompleted,
    role,
    peerCount,
    isReconnecting
  })
  const isDownloading = totals.activeCount > 0

  useEffect(() => {
    if (step === 'completed') {
      router.replace('/receive/complete')
    }
  }, [step, router])

  const handleEndSession = useCallback(() => {
    void clearSession()
    if (router.canDismiss()) router.dismissAll()
  }, [router])

  useEffect(() => {
    navigation.setOptions({
      headerBackVisible: false,
      headerLeft: () => (
        <Pressable
          accessibilityRole='button'
          accessibilityLabel={t('common:actions.back')}
          onPress={handleEndSession}
          hitSlop={12}
          style={({ pressed }) => ({
            paddingHorizontal: 8,
            paddingVertical: 4,
            opacity: pressed ? 0.6 : 1
          })}
        >
          <ArrowLeftIcon size={22} color={theme.colors.colorTextPrimary} />
        </Pressable>
      )
    })
  }, [navigation, handleEndSession, t, theme.colors.colorTextPrimary])

  const totalBytes = incomingFileOffers.reduce(
    (sum, f) => sum + (f.kind === 'file' ? f.size : 0),
    0
  )
  const { title, description } = getReceivePageCopy(t, step, incomingFileOffers.length, totalBytes)

  const handleDownloadAll = async () => {
    if (incomingFileOffers.length === 0 || isDownloading) return
    const targetDir = uriToPath(Paths.document.uri)
    try {
      await downloadFiles(createDirectoryDownloadRequests(incomingFileOffers, targetDir))
    } catch (err) {
      console.warn('ReceiveIncomingScreen: downloadFiles failed', err)
    }
  }

  const sizeLabel = totalBytes > 0 ? ` (${formatFileSize(totalBytes)})` : ''
  const isReconnectingStep = step === 'reconnecting'

  const endSessionButton = (
    <Button onClick={handleEndSession} size='lg' variant='secondary' width='full'>
      {t('common:actions.endSession')}
    </Button>
  )

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

  const badge = (
    <View
      style={[
        styles.badge,
        {
          borderColor: withAlpha(theme.colors.colorSuccess, 0.22),
          backgroundColor: withAlpha(theme.colors.colorSuccess, 0.08)
        }
      ]}
    >
      <View style={[styles.badgeDot, { backgroundColor: theme.colors.colorSuccess }]} />
      <Text style={[styles.badgeText, { color: theme.colors.colorSuccess }]}>
        {t('common:status.connected')}
      </Text>
    </View>
  )

  return (
    <Layout
      title={title}
      description={description}
      badge={badge}
      hasNativeHeader
      footer={
        <View style={styles.footerStack}>
          <Button
            disabled={isDownloading}
            icon={<DownloadIcon size={18} color={theme.colors.colorOnAccent} />}
            onClick={() => void handleDownloadAll()}
            size='lg'
            variant='light'
            width='full'
          >
            {isDownloading
              ? t('receive:actions.downloadingPercent', { percent: totals.percent })
              : sizeLabel
                ? t('receive:actions.downloadAllWithSize', { size: formatFileSize(totalBytes) })
                : t('receive:actions.downloadAll')}
          </Button>
          {endSessionButton}
        </View>
      }
    >
      {displayError ? (
        <ErrorPanel title={t('receive:errors.transferIssue')} message={displayError} />
      ) : null}
      <ReceiveIncomingView />
    </Layout>
  )
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: 100,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 5
  },
  badgeDot: {
    width: 6,
    height: 6,
    borderRadius: 3
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '500'
  },
  footerStack: {
    gap: 8,
    width: '100%'
  }
})
