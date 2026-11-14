import { useSubscriptionStore } from '../account/runtime/store'
import { useTransferStore } from '../transfer/store'
import { isReceiveRelayLimited, isSendRelayLimited } from './relayLimit'

export function useReceiveRelayLimit(): boolean {
  const pro = useSubscriptionStore((s) => s.active)
  return useTransferStore((state) => isReceiveRelayLimited(state, pro))
}

export function useSendRelayLimit(totalBytes: number): boolean {
  const pro = useSubscriptionStore((s) => s.active)
  return useTransferStore((state) => isSendRelayLimited(state, totalBytes, pro))
}
