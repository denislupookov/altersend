import type { IncomingFileOffer } from '@altersend/core'
import { NATIVE_RELAY_MAX_BYTES } from '../constants/transfer'
import type { TransferSessionState } from '../transfer/types'

type PeerRelayState = Pick<TransferSessionState, 'connectionTypes' | 'proPeers'>

type ReceiveRelayState = PeerRelayState &
  Pick<TransferSessionState, 'transferPeerKey' | 'incomingFileOffers'>

type SendRelayState = PeerRelayState & Pick<TransferSessionState, 'connectedPeers'>

export function exceedsFreeRelay(totalBytes: number, pro: boolean): boolean {
  return !pro && totalBytes > NATIVE_RELAY_MAX_BYTES
}

function isPeerRelayLimited(
  state: PeerRelayState,
  peerKey: string,
  totalBytes: number,
  selfPro: boolean
): boolean {
  if (state.connectionTypes[peerKey] !== 'relay') return false
  return exceedsFreeRelay(totalBytes, selfPro || !!state.proPeers[peerKey])
}

function offeredBytes(offers: IncomingFileOffer[]): number {
  return offers.reduce((sum, offer) => sum + (offer.kind === 'file' ? offer.size : 0), 0)
}

export function isReceiveRelayLimited(state: ReceiveRelayState, selfPro: boolean): boolean {
  const peerKey = state.transferPeerKey
  if (!peerKey) return false
  return isPeerRelayLimited(state, peerKey, offeredBytes(state.incomingFileOffers), selfPro)
}

export function isSendRelayLimited(
  state: SendRelayState,
  totalBytes: number,
  selfPro: boolean
): boolean {
  return Object.values(state.connectedPeers).some(
    (peer) => !peer.disconnectedAt && isPeerRelayLimited(state, peer.peerKey, totalBytes, selfPro)
  )
}
