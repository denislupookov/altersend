import { useCallback, useEffect } from 'react'
import { View } from 'react-native'
import { Button } from '@altersend/components'
import { useTranslation } from '@altersend/locales'
import { Layout } from '@/src/components'
import { SelectFilesView } from '@/src/transfer/send'
import { usePathname, useRouter } from 'expo-router'
import { getSendPageCopy, getSendStep, isShareStep, useTransferStore } from '@altersend/domain'
import { continueShare } from '@altersend/domain'

function NavigationController() {
  const router = useRouter()
  const pathname = usePathname()
  const connectionState = useTransferStore((s) => s.connectionState)
  const draftPhase = useTransferStore((s) => s.draftPhase)
  const step = getSendStep({ draftPhase, isPeerConnected: connectionState === 'peer-connected' })

  useEffect(() => {
    const target =
      step === 'preparing' ? '/send/preparing' : isShareStep(step) ? '/send/share' : '/send'

    if (pathname === target) return

    if (target === '/send/preparing') {
      if (pathname === '/send') router.push('/send/preparing')
      else router.replace('/send/preparing')
    } else if (target === '/send/share') {
      if (pathname === '/send') router.push('/send/share')
      else router.replace('/send/share')
    } else if (
      (pathname === '/send/preparing' || pathname === '/send/share') &&
      router.canDismiss()
    ) {
      router.dismissAll()
    }
  }, [step, pathname, router])

  return null
}

export default function SendSelectScreen() {
  const { t } = useTranslation(['send'])
  const selectedFiles = useTransferStore((s) => s.selectedFiles)
  const draftPhase = useTransferStore((s) => s.draftPhase)
  const connectionState = useTransferStore((s) => s.connectionState)
  const router = useRouter()

  const step = getSendStep({ draftPhase, isPeerConnected: connectionState === 'peer-connected' })
  const copy = getSendPageCopy(t, step)
  const hasSelectedFiles = selectedFiles.length > 0

  const openMenu = useCallback(() => router.push('/settings'), [router])

  return (
    <View style={{ flex: 1 }}>
      <NavigationController />
      <Layout
        title={copy.title}
        description={copy.description}
        onMenuPress={openMenu}
        footer={
          hasSelectedFiles ? (
            <Button
              onClick={() => void continueShare(selectedFiles)}
              size='lg'
              variant='primary'
              width='full'
            >
              {t('send:actions.sendFiles', { count: selectedFiles.length })}
            </Button>
          ) : undefined
        }
      >
        <SelectFilesView />
      </Layout>
    </View>
  )
}
