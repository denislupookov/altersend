import { useTransferStore } from '../transfer/store'
import { getReceiveStep, type ReceiveStep } from './pageUi'
import type { ReceiveDownloads } from './useReceiveDownloads'

export function useReceiveStep({
  fileOffers,
  textOffers,
  allDownloaded
}: ReceiveDownloads): ReceiveStep {
  const role = useTransferStore((s) => s.role)
  const peerCount = useTransferStore((s) => s.peerCount)
  const isReconnecting = useTransferStore((s) => s.isReconnecting)
  const reconnectExhausted = useTransferStore((s) => s.reconnectExhausted)
  const sessionEndedByPeer = useTransferStore((s) => s.sessionEndedByPeer)

  return getReceiveStep({
    hasIncomingFiles: fileOffers.length + textOffers.length > 0,
    allDownloadsCompleted: allDownloaded,
    role,
    peerCount,
    isReconnecting,
    reconnectExhausted,
    sessionEndedByPeer
  })
}
