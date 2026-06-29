import { useState } from 'react'
import {
  clearSession,
  dismissInvite,
  joinSession,
  useSimulatedLoading,
  useTransferStore
} from '@altersend/domain'
import { useTranslation } from '@altersend/locales'
import { bridgeApi, hasBridge } from './api/bridgeApi'
import {
  InviteBanner,
  openSettingsPanel,
  PairDeviceModal,
  PairRequestBanner,
  ToastProvider,
  UpdateBanner
} from './components'
import { isOnboardingCompleted, markOnboardingCompleted } from './lifecycle/onboardingStorage'
import { useUpdateReady } from './lifecycle/useUpdateReady'
import { BridgeUnavailablePage, LoadingPage, OnboardingPage, TransferPage } from './pages'

type TransferTab = 'send' | 'receive'

export default function App() {
  const { t } = useTranslation(['common'])
  const [showOnboarding, setShowOnboarding] = useState(() => !isOnboardingCompleted())
  const [showPairPrompt, setShowPairPrompt] = useState(false)
  const [activeTab, setActiveTab] = useState<TransferTab>('send')
  const progress = useSimulatedLoading()
  const role = useTransferStore((s) => s.role)
  const updateReady = useUpdateReady()

  const switchTab = (next: TransferTab): boolean => {
    if (next === activeTab) return true
    if (role !== null) {
      const message =
        role === 'sender'
          ? t('common:confirm.leaveShareSession')
          : t('common:confirm.leaveReceiveSession')
      if (!window.confirm(message)) return false
      void clearSession()
    }
    setActiveTab(next)
    return true
  }

  if (progress < 100) {
    return <LoadingPage progress={progress} />
  }

  if (!hasBridge()) {
    return <BridgeUnavailablePage />
  }

  const version = bridgeApi.pkg().version

  if (showOnboarding) {
    return (
      <>
        <OnboardingPage
          onFinish={() => {
            markOnboardingCompleted()
            setShowOnboarding(false)
            setShowPairPrompt(true)
          }}
        />
        <UpdateBanner ready={updateReady} />
      </>
    )
  }

  return (
    <ToastProvider>
      <TransferPage version={version} activeTab={activeTab} onTabChange={switchTab} />
      <PairRequestBanner />
      <InviteBanner
        onAccept={(topic) => {
          if (switchTab('receive')) {
            dismissInvite()
            void joinSession(topic)
          }
        }}
      />
      <UpdateBanner ready={updateReady} />
      <PairDeviceModal
        open={showPairPrompt}
        onPair={() => {
          setShowPairPrompt(false)
          openSettingsPanel('devices')
        }}
        onSkip={() => setShowPairPrompt(false)}
      />
    </ToastProvider>
  )
}
