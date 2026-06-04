import { useState } from 'react'
import { useSimulatedLoading } from '@altersend/domain'
import { bridgeApi, hasBridge } from './api/bridgeApi'
import { UpdateBanner } from './components/UpdateBanner'
import { isOnboardingCompleted, markOnboardingCompleted } from './lifecycle/onboardingStorage'
import { useUpdateReady } from './lifecycle/useUpdateReady'
import { BridgeUnavailablePage, LoadingPage, OnboardingPage, TransferPage } from './pages'

export default function App() {
  const [showOnboarding, setShowOnboarding] = useState(() => !isOnboardingCompleted())
  const progress = useSimulatedLoading()
  const updateReady = useUpdateReady()

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
          }}
        />
        <UpdateBanner ready={updateReady} />
      </>
    )
  }

  return (
    <>
      <TransferPage version={version} />
      <UpdateBanner ready={updateReady} />
    </>
  )
}
