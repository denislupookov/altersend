import { useAccount, useSubscriptionStore } from '@altersend/domain'
import { accountAdapter } from '../../../lifecycle/account'
import { AccountSection } from './AccountSection'
import { ActiveAccountSection } from './ActiveAccountSection'

export function AccountRoute() {
  const isPro = useSubscriptionStore((state) => state.active)
  const model = useAccount(accountAdapter)

  const settled = model.phase !== 'paywall'

  if (model.phase === 'active' || (isPro && !settled)) return <ActiveAccountSection model={model} />

  return <AccountSection model={model} />
}
