import type { Translate } from '../i18n'
import { useSubscriptionStore } from '../account/runtime/store'
import { useTransferStore } from '../transfer/store'
import { getConnectingStatus, getConnectingStatusKey, type ConnectStatus } from './pageUi'

export interface ConnectingStatusView {
  status: ConnectStatus
  showProOffer: boolean
}

export function useConnectingStatus(t: Translate): ConnectingStatusView {
  const relayBusy = useTransferStore((s) => s.relayBusy)
  const stage = useTransferStore((s) => s.connectStage)
  const reason = useTransferStore((s) => s.connectReason)
  const peerCount = useTransferStore((s) => s.peerCount)
  const isPro = useSubscriptionStore((s) => s.active)

  const input = { relayBusy, stage, reason, peerCount }
  return {
    status: getConnectingStatus(t, input),
    showProOffer: !isPro && getConnectingStatusKey(input) === 'relayBusy'
  }
}
