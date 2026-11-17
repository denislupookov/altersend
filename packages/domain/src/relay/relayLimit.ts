import type { IncomingFileOffer } from '@altersend/core'
import { NATIVE_RELAY_MAX_BYTES } from '../constants/transfer'
import type { TransferConnectionType, TransferSessionState } from '../transfer/types'

type ReceiveRelayState = Pick<
  TransferSessionState,
  'connectionTypes' | 'proPeers' | 'transferPeerKey' | 'incomingFileOffers'
>

export function exceedsFreeRelay(totalBytes: number, pro: boolean): boolean {
  return !pro && totalBytes > NATIVE_RELAY_MAX_BYTES
}

export function isRelayLimited(
  connection: TransferConnectionType | null | undefined,
  totalBytes: number,
  pro: boolean
): boolean {
  return connection === 'relay' && exceedsFreeRelay(totalBytes, pro)
}

function offeredBytes(offers: IncomingFileOffer[]): number {
  return offers.reduce((sum, offer) => sum + (offer.kind === 'file' ? offer.size : 0), 0)
}

export function isReceiveRelayLimited(state: ReceiveRelayState, selfPro: boolean): boolean {
  const peerKey = state.transferPeerKey
  if (!peerKey) return false
  return isRelayLimited(
    state.connectionTypes[peerKey],
    offeredBytes(state.incomingFileOffers),
    selfPro || !!state.proPeers[peerKey]
  )
}
