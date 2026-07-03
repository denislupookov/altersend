import { useCallback, useEffect } from 'react'
import { Pressable } from 'react-native'
import { useTheme } from '@altersend/components'
import { ArrowLeftIcon } from '@altersend/components/icons'
import { getSendStep, isShareStep, useTransferStore } from '@altersend/domain'
import { clearSenderFlow } from '@altersend/domain'
import { useTranslation } from '@altersend/locales'
import { Layout } from '@/src/components'
import { PreparingView } from '@/src/transfer/send'
import { useNavigation, useRouter } from 'expo-router'

export default function SendPreparingScreen() {
  const { t } = useTranslation(['send', 'common'])
  const { theme } = useTheme()
  const draftPhase = useTransferStore((s) => s.draftPhase)
  const connectionState = useTransferStore((s) => s.connectionState)
  const step = getSendStep({ draftPhase, isPeerConnected: connectionState === 'peer-connected' })
  const navigation = useNavigation()
  const router = useRouter()

  useEffect(() => {
    if (isShareStep(step)) router.replace('/send/share')
  }, [step, router])

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
    <Layout title='' description='' hasNativeHeader>
      <PreparingView />
    </Layout>
  )
}
