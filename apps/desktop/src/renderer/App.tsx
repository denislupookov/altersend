import { useState } from 'react'
import {
  acceptInvite,
  clearSession,
  getLeaveSessionMessage,
  useSimulatedLoading,
  useTransferStore,
  useWhatsNew,
  type IncomingInvite
} from '@altersend/domain'
import { useTranslation } from '@altersend/locales'
import { bridgeApi, hasBridge } from './api/bridgeApi'
import {
  ConfirmDialog,
  InviteBanner,
  PairRequestBanner,
  ToastProvider,
  UpdateBanner,
  WhatsNewModal
} from './components'
import { isOnboardingCompleted, markOnboardingCompleted } from './lifecycle/onboardingStorage'
import { useExternalFiles } from './lifecycle/useExternalFiles'
import { useUpdateReady } from './lifecycle/useUpdateReady'
import { whatsNewStorage } from './lifecycle/whatsNewStorage'
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
  const [version] = useState(() => (hasBridge() ? bridgeApi.pkg().version : ''))
  const progress = useSimulatedLoading()
  const role = useTransferStore((s) => s.role)
  const updateReady = useUpdateReady()
  const whatsNew = useWhatsNew({
    version,
    storage: whatsNewStorage,
    isReturningUser: isOnboardingCompleted
  })
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

  const joinInvite = (invite: IncomingInvite): void => {
    acceptInvite(invite).catch((error) => console.error('App: acceptInvite failed', error))
  }

  const confirmSwitchTab = () => {
    if (!pendingSwitch) return
    const { tab, onSwitched } = pendingSwitch
    setPendingSwitch(null)
    setActiveTab(tab)
    clearSession()
      .catch((error) => console.error('App: clearSession failed', error))
      .then(() => onSwitched?.())
  }

  if (progress < 100) {
    return <LoadingPage progress={progress} />
  }

  if (!hasBridge()) {
    return <BridgeUnavailablePage />
  }

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
        onAccept={(invite) => switchTab('receive', () => joinInvite(invite))}
        onAutoAccept={(invite) => {
          setActiveTab('receive')
          joinInvite(invite)
        }}
      />
      <UpdateBanner ready={updateReady} />
      <WhatsNewModal
        open={whatsNew.release !== null && !updateReady}
        release={whatsNew.release}
        version={version}
        onClose={whatsNew.dismiss}
      />
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
