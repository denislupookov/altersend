import { useSubscriptionStore } from '../account/runtime/store'
import { useTransferStore } from '../transfer/store'
import { isReceiveRelayLimited } from './relayLimit'

export function useReceiveRelayLimit(): boolean {
  const pro = useSubscriptionStore((s) => s.active)
  return useTransferStore((state) => isReceiveRelayLimited(state, pro))
}
