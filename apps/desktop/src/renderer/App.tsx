import { useState } from 'react'
import { useSimulatedLoading } from '@altersend/domain'
import { bridgeApi, hasBridge } from './api/bridgeApi'
import { UpdateBanner } from './components/UpdateBanner'
import { isOnboardingCompleted, markOnboardingCompleted } from './lifecycle/onboardingStorage'
import { BridgeUnavailablePage, LoadingPage, OnboardingPage, TransferPage } from './pages'

export default function App() {
  const [showOnboarding, setShowOnboarding] = useState(() => !isOnboardingCompleted())
  const progress = useSimulatedLoading()

  if (progress < 100) {
    return <LoadingPage progress={progress} />
  }

  if (!hasBridge()) {
    return <BridgeUnavailablePage />
  }

  const version = bridgeApi.pkg().version

  if (showOnboarding) {
    return (
      <OnboardingPage
        onFinish={() => {
          markOnboardingCompleted()
          setShowOnboarding(false)
        }}
      />
    )
  }

  return (
    <>
      <TransferPage version={version} />
      <UpdateBanner />
    </>
  )
}
