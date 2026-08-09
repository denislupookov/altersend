import { useEffect } from 'react'
import { useTranslation } from '@altersend/locales'
import type { AccountPhase } from '@altersend/domain'
import { useRouter } from 'expo-router'
import {
  ApprovalWaiting,
  CheckoutWaiting,
  CodeEntry,
  Paywall,
  PurchaseSuccess,
  useAccountModel,
  type AccountPhaseProps
} from '@/src/account'

type PhaseScreen = (props: AccountPhaseProps) => React.ReactElement | null

const SCREENS: Record<Exclude<AccountPhase, 'active'>, PhaseScreen> = {
  paywall: Paywall,
  entering: CodeEntry,
  approval: ApprovalWaiting,
  waiting: CheckoutWaiting,
  success: PurchaseSuccess
}

export default function AccountScreen() {
  const { t } = useTranslation(['settings'])
  const model = useAccountModel()
  const router = useRouter()

  useEffect(() => {
    if (model.phase === 'active') router.back()
  }, [model.phase, router])

  if (model.phase === 'active') return null

  const Screen = SCREENS[model.phase]

  return (
    <Screen
      model={model}
      errorText={model.errorKey && t(model.errorKey)}
      onDismiss={() => router.back()}
    />
  )
}
