import { useState } from 'react'
import {
  clearSession,
  dismissInvite,
  getLeaveSessionMessage,
  joinSession,
  useSimulatedLoading,
  useTransferStore
} from '@altersend/domain'
import { useTranslation } from '@altersend/locales'
import { bridgeApi, hasBridge } from './api/bridgeApi'
import {
  ConfirmDialog,
  InviteBanner,
  PairRequestBanner,
  ToastProvider,
  UpdateBanner
} from './components'
import { isOnboardingCompleted, markOnboardingCompleted } from './lifecycle/onboardingStorage'
import { useExternalFiles } from './lifecycle/useExternalFiles'
import { useUpdateReady } from './lifecycle/useUpdateReady'
import { BridgeUnavailablePage, LoadingPage, OnboardingPage, TransferPage } from './pages'

type TransferTab = 'send' | 'receive'

interface PendingTabSwitch {
  tab: TransferTab
  message: string
  onSwitched?: () => void
}

export default function App() {
  const { t } = useTranslation(['common'])
  const [showOnboarding, setShowOnboarding] = useState(() => !isOnboardingCompleted())
  const [activeTab, setActiveTab] = useState<TransferTab>('send')
  const [pendingSwitch, setPendingSwitch] = useState<PendingTabSwitch | null>(null)
  const progress = useSimulatedLoading()
  const role = useTransferStore((s) => s.role)
  const updateReady = useUpdateReady()
  const externalFiles = useExternalFiles(() => setActiveTab('send'))

  const switchTab = (next: TransferTab, onSwitched?: () => void): void => {
    if (next === activeTab) {
      onSwitched?.()
      return
    }
    if (role !== null) {
      setPendingSwitch({ tab: next, message: getLeaveSessionMessage(t, role), onSwitched })
      return
    }
    setActiveTab(next)
    onSwitched?.()
  }

  const confirmSwitchTab = () => {
    if (!pendingSwitch) return
    const { tab, onSwitched } = pendingSwitch
    setPendingSwitch(null)
    clearSession().catch((error) => console.error('App: clearSession failed', error))
    setActiveTab(tab)
    onSwitched?.()
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
          switchTab('receive', () => {
            dismissInvite()
            joinSession(topic).catch((error) => console.error('App: joinSession failed', error))
          })
        }}
      />
      <UpdateBanner ready={updateReady} />
      <ConfirmDialog
        open={pendingSwitch !== null}
        title={t('common:actions.endSession')}
        message={pendingSwitch?.message}
        confirmLabel={t('common:actions.continue')}
        cancelLabel={t('common:actions.cancel')}
        onConfirm={confirmSwitchTab}
        onCancel={() => setPendingSwitch(null)}
      />
      <ConfirmDialog
        open={externalFiles.pending}
        title={t('common:actions.endSession')}
        message={getLeaveSessionMessage(t, role)}
        confirmLabel={t('common:actions.continue')}
        cancelLabel={t('common:actions.cancel')}
        onConfirm={externalFiles.confirm}
        onCancel={externalFiles.cancel}
      />
    </ToastProvider>
  )
}
