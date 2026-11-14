import { useEffect, useState } from 'react'
import { useTranslation } from '@altersend/locales'
import type { AccountPhase } from '@altersend/domain'
import { useLocalSearchParams, useRouter } from 'expo-router'
import {
  ApprovalWaiting,
  CheckoutWaiting,
  CodeEntry,
  PageIndicator,
  Paywall,
  ProIntro,
  PurchaseSuccess,
  useAccountModel,
  type AccountPhaseProps
} from '@/src/account'
import { isOnboardingEntry } from '@/src/account/onboardingEntry'
import { requestNotificationPermission } from '@/src/lifecycle/notificationPermission'

type PhaseScreen = (props: AccountPhaseProps) => React.ReactElement | null

const SCREENS: Record<Exclude<AccountPhase, 'active'>, PhaseScreen> = {
  paywall: Paywall,
  entering: CodeEntry,
  approval: ApprovalWaiting,
  waiting: CheckoutWaiting,
  success: PurchaseSuccess
}

const INTRO_PAGE_COUNT = 2

export default function AccountScreen() {
  const { t } = useTranslation(['settings'])
  const model = useAccountModel()
  const router = useRouter()
  const params = useLocalSearchParams()
  const [fromOnboarding] = useState(() => isOnboardingEntry(params))
  const [showIntro, setShowIntro] = useState(fromOnboarding)

  useEffect(() => {
    if (model.phase === 'active') router.back()
  }, [model.phase, router])

  useEffect(() => {
    if (!fromOnboarding) return
    return () => {
      requestNotificationPermission().catch((err: unknown) => {
        console.warn('account: notification permission request failed', err)
      })
    }
  }, [fromOnboarding])

  if (model.phase === 'active') return null

  const dismiss = () => router.back()

  if (showIntro && model.phase === 'paywall') {
    return (
      <ProIntro
        onContinue={() => setShowIntro(false)}
        onDismiss={dismiss}
        pageIndicator={<PageIndicator count={INTRO_PAGE_COUNT} index={0} />}
      />
    )
  }

  const Screen = SCREENS[model.phase]

  return (
    <Screen model={model} errorText={model.errorKey && t(model.errorKey)} onDismiss={dismiss} />
  )
}
