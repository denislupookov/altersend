import type { ReactElement } from 'react'
import { useTranslation } from '@altersend/locales'
import type { AccountModel, AccountPhase } from '@altersend/domain'
import {
  CheckoutWaiting,
  CodeEntry,
  Paywall,
  PurchaseSuccess,
  type AccountPhaseProps
} from './account'

type PhaseScreen = (props: AccountPhaseProps) => ReactElement | null

const SCREENS: Record<Exclude<AccountPhase, 'active'>, PhaseScreen> = {
  paywall: Paywall,
  entering: CodeEntry,
  approval: CheckoutWaiting,
  waiting: CheckoutWaiting,
  success: PurchaseSuccess
}

export function AccountSection({ model }: { model: AccountModel }) {
  const { t } = useTranslation(['settings'])

  if (model.phase === 'active') return null

  const Screen = SCREENS[model.phase]

  return <Screen model={model} errorText={model.errorKey && t(model.errorKey)} />
}
