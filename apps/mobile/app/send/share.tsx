import { useCallback, useEffect } from 'react'
import { Platform, Pressable, View } from 'react-native'
import { Button, useTheme } from '@altersend/components'
import { ArrowLeftIcon } from '@altersend/components/icons'
import { getSendStep, type SendStep, useTransferStore } from '@altersend/domain'
import { clearSenderFlow } from '@altersend/domain'
import { useTranslation } from '@altersend/locales'
import { Layout } from '@/src/components'
import { ShareView } from '@/src/transfer/send'
import { useNavigation } from 'expo-router'

function getSendPageCopy(t: ReturnType<typeof useTranslation>['t'], step: SendStep) {
  switch (step) {
    case 'selecting':
      return {
        title: t('send:page.selecting.title'),
        description: t('send:page.selecting.description')
      }
    case 'preparing':
      return {
        title: t('send:page.preparing.title'),
        description: t('send:page.preparing.description')
      }
    case 'waiting_for_receiver':
      return {
        title: t('send:page.waitingForReceiver.title'),
        description: t('send:page.waitingForReceiver.description')
      }
    case 'receiver_connected':
      return {
        title: t('send:page.receiverConnected.title'),
        description: t('send:page.receiverConnected.description')
      }
  }
}

export default function SendShareScreen() {
  const { t } = useTranslation(['send', 'common'])
  const { theme } = useTheme()
  const draftPhase = useTransferStore((s) => s.draftPhase)
  const connectionState = useTransferStore((s) => s.connectionState)
  const step = getSendStep({ draftPhase, isPeerConnected: connectionState === 'peer-connected' })
  const copy = getSendPageCopy(t, step)
  const navigation = useNavigation()

  const handleBack = useCallback(() => {
    clearSenderFlow()
  }, [])

  useEffect(() => {
    navigation.setOptions({
      headerBackVisible: false,
      headerLeft: () => (
        <Pressable
          accessibilityRole='button'
          accessibilityLabel={t('common:actions.back')}
          onPress={handleBack}
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
  }, [navigation, handleBack, t, theme.colors.colorTextPrimary])

  return (
    <Layout
      title={copy.title}
      description={copy.description}
      hasNativeHeader
      footer={
        <View style={{ marginBottom: Platform.OS === 'android' ? 20 : 0 }}>
          <Button onClick={clearSenderFlow} size='lg' variant='secondary' width='full'>
            {t('common:actions.endSession')}
          </Button>
        </View>
      }
    >
      <ShareView />
    </Layout>
  )
}
