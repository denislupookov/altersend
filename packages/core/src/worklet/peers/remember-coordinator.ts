import { buildPairingInfo, computePendingPairing, type PendingPairing } from './pairing'
import { resolveVote, buildRememberedPeer, type LocalVote, type RememberDecision } from './vote'
import type { RememberedPeer } from './remembered-peer'
import type { DeviceIdentity } from '../identity/device-identity-store'
import type { PairingInfo, PeerControlMessage, RememberVote } from '../transfer/control-channel'
import {
  createRememberConfirmedEvent,
  createRememberDeclinedEvent,
  createRememberRequestedEvent,
  type TransferIPCMessage
} from '../rpc/events'
import { BadRequestError, type RememberVoteInput, type RememberVoteReply } from '../rpc/protocol'

const REMEMBER_VOTE_TIMEOUT_MS = 60_000

export interface PairingSession {
  peerKey: string
  handshakeHash: Uint8Array | null
}

export interface RememberCoordinatorDeps {
  deviceIdentityStore: { getOrCreate(): Promise<DeviceIdentity> }
  rememberedStore: { remember(peer: RememberedPeer): Promise<RememberedPeer> }
  broadcast: (message: PeerControlMessage) => void
  emit: (event: TransferIPCMessage) => void
}

export class RememberCoordinator {
  private readonly deps: RememberCoordinatorDeps
  private readonly deviceIdentityReady: Promise<DeviceIdentity>
  private deviceIdentity: DeviceIdentity | null = null
  private readonly pendingPairings = new Map<string, PendingPairing>()
  private localVote: { transferId: string; vote: LocalVote } | null = null
  private readonly remoteVotes = new Map<string, { decision: RememberDecision; transferId: string }>()
  private voteTimer: unknown = null

  constructor(deps: RememberCoordinatorDeps) {
    this.deps = deps
    this.deviceIdentityReady = deps.deviceIdentityStore.getOrCreate()
    this.deviceIdentityReady
      .then((identity) => {
        this.deviceIdentity = identity
      })
      .catch((err) => console.warn('RememberCoordinator: device identity init failed', err))
  }

  handlePairingInfo(message: PairingInfo, session: PairingSession): void {
    if (!session.handshakeHash || !this.deviceIdentity) {
      console.warn('RememberCoordinator: pairing-info before handshake/identity ready; ignoring')
      return
    }
    const pending = computePendingPairing(
      this.deviceIdentity.publicKey,
      message,
      session.handshakeHash
    )
    this.pendingPairings.set(session.peerKey, pending)
    this.evaluateVote(session.peerKey)
  }

  handleRememberVote(message: RememberVote, peerKey: string): void {
    this.remoteVotes.set(peerKey, { decision: message.vote, transferId: message.transferId })
    if (message.vote === 'remember' && !this.localVote) {
      const pending = this.pendingPairings.get(peerKey)
      this.deps.emit(
        createRememberRequestedEvent({
          transferId: message.transferId,
          peerKey,
          displayName: pending?.remoteDisplayName ?? peerKey.slice(0, 6),
          deviceType: pending?.remoteDeviceType ?? 'unknown'
        })
      )
    }
    this.evaluateVote(peerKey)
  }

  async vote(input: RememberVoteInput): Promise<RememberVoteReply> {
    const { transferId, vote, isMine } = input
    if (typeof transferId !== 'string' || transferId.length === 0) {
      throw new BadRequestError('rememberVote: transferId required')
    }
    if (vote !== 'remember' && vote !== 'no') {
      throw new BadRequestError('rememberVote: vote must be "remember" or "no"')
    }
    if (typeof isMine !== 'boolean') {
      throw new BadRequestError('rememberVote: isMine must be a boolean')
    }

    this.localVote = { transferId, vote: { decision: vote, isMine } }
    if (vote === 'remember') {
      await this.deviceIdentityReady.catch(() => {})
      this.broadcastPairingInfo()
      this.startVoteTimeout(transferId)
    } else {
      this.clearVoteTimer()
    }
    this.deps.broadcast({ type: 'remember-vote', transferId, vote, isMine })

    for (const peerKey of this.knownVotePeers()) this.evaluateVote(peerKey)
    return { ok: true }
  }

  onPeerDisconnected(peerKey: string): void {
    const remote = this.remoteVotes.get(peerKey)
    if (remote?.decision === 'remember' && !this.localVote) {
      this.deps.emit(createRememberDeclinedEvent(remote.transferId))
    }
    this.forgetPeerVote(peerKey)
    if (this.localVote && this.remoteVotes.size === 0) this.endVoteRound()
  }

  reset(): void {
    this.endVoteRound()
  }

  private evaluateVote(peerKey: string): void {
    const local = this.localVote
    const remoteEntry = this.remoteVotes.get(peerKey)
    const remote =
      remoteEntry && remoteEntry.transferId === local?.transferId ? remoteEntry.decision : null
    const status = resolveVote(local?.vote ?? null, remote)
    if (status === 'pending') return

    if (status === 'confirmed') {
      const pending = this.pendingPairings.get(peerKey)
      if (!pending || !local) return
      const peer = buildRememberedPeer(pending, local.vote, Date.now())
      void this.deps.rememberedStore
        .remember(peer)
        .then((saved) => this.deps.emit(createRememberConfirmedEvent(saved)))
        .catch((err) => console.warn('RememberCoordinator: failed to persist remembered peer', err))
    } else {
      this.deps.emit(createRememberDeclinedEvent(local?.transferId ?? ''))
    }
    this.forgetPeerVote(peerKey)
    if (this.remoteVotes.size === 0) this.endVoteRound()
  }

  private broadcastPairingInfo(): void {
    if (!this.deviceIdentity) {
      console.warn('RememberCoordinator: device identity not ready; cannot send pairing-info')
      return
    }
    this.deps.broadcast(buildPairingInfo(this.deviceIdentity, { canBackground: false }))
  }

  private knownVotePeers(): Set<string> {
    return new Set([...this.pendingPairings.keys(), ...this.remoteVotes.keys()])
  }

  private startVoteTimeout(transferId: string): void {
    this.clearVoteTimer()
    this.voteTimer = setTimeout(() => {
      this.voteTimer = null
      this.deps.emit(createRememberDeclinedEvent(transferId))
      this.endVoteRound()
    }, REMEMBER_VOTE_TIMEOUT_MS)
  }

  private clearVoteTimer(): void {
    if (this.voteTimer !== null) {
      clearTimeout(this.voteTimer)
      this.voteTimer = null
    }
  }

  private forgetPeerVote(peerKey: string): void {
    this.remoteVotes.delete(peerKey)
    this.pendingPairings.delete(peerKey)
  }

  private endVoteRound(): void {
    this.clearVoteTimer()
    this.localVote = null
    this.remoteVotes.clear()
    this.pendingPairings.clear()
  }
}
