import b4a from 'b4a'
import type { PendingPairing } from './pairing'
import type { RememberedPeer } from './remembered-peer'

export type RememberDecision = 'remember' | 'no'

export interface LocalVote {
  decision: RememberDecision
  isMine: boolean
}

export type VoteStatus = 'pending' | 'confirmed' | 'declined'

export function resolveVote(local: LocalVote | null, remote: RememberDecision | null): VoteStatus {
  if (local?.decision === 'no' || remote === 'no') return 'declined'
  if (!local || remote === null) return 'pending'
  return 'confirmed'
}

export function buildRememberedPeer(
  pending: PendingPairing,
  local: LocalVote,
  now: number
): RememberedPeer {
  return {
    remoteDevicePubkey: b4a.toString(pending.remoteDevicePubkey, 'hex'),
    rendezvousTopic: b4a.toString(pending.rendezvousTopic, 'hex'),
    displayName: pending.remoteDisplayName,
    deviceType: pending.remoteDeviceType,
    isMine: local.isMine,
    autoAccept: local.isMine,
    blocked: false,
    pairedAt: now,
    lastSeenAt: now
  }
}
