import b4a from 'b4a'
import {
  buildPairingInfo,
  computePendingPairing,
  verifyPairingInfo,
  type PendingPairing
} from './pairing'
import { resolveVote, buildRememberedPeer, type RememberDecision } from './vote'
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
  rememberedStore: {
    remember(peer: RememberedPeer): Promise<RememberedPeer>
    get(pubkeyHex: string): Promise<RememberedPeer | null>
  }
  sendTo: (peerKey: string, message: PeerControlMessage) => void
  getHandshakeHash: (peerKey: string) => Uint8Array | null
  emit: (event: TransferIPCMessage) => void
}

interface OurVote {
  transferId: string
  decision: RememberDecision
  isMine: boolean
}

interface RemoteVote {
  transferId: string
  decision: RememberDecision
}

export class RememberCoordinator {
  private readonly deps: RememberCoordinatorDeps
  private readonly deviceIdentityReady: Promise<DeviceIdentity>
  private deviceIdentity: DeviceIdentity | null = null
  private readonly pendingPairings = new Map<string, PendingPairing>()
  private readonly ourVotes = new Map<string, OurVote>()
  private readonly remoteVotes = new Map<string, RemoteVote>()
  private readonly timers = new Map<string, unknown>()
  private readonly sentPairingInfo = new Set<string>()

  constructor(deps: RememberCoordinatorDeps) {
    this.deps = deps
    this.deviceIdentityReady = deps.deviceIdentityStore.getOrCreate()
    this.deviceIdentityReady
      .then((identity) => {
        this.deviceIdentity = identity
      })
      .catch((err) => console.warn('RememberCoordinator: device identity init failed', err))
  }

  onPeerConnected(peerKey: string): void {
    this.deviceIdentityReady
      .then(() => {
        if (this.deps.getHandshakeHash(peerKey)) {
          this.sendPairingInfo(peerKey)
        }
      })
      .catch(() => {})
  }

  async handlePairingInfo(message: PairingInfo, session: PairingSession): Promise<void> {
    if (!session.handshakeHash || !this.deviceIdentity) {
      console.warn('RememberCoordinator: pairing-info before handshake/identity ready; ignoring')
      return
    }
    if (!verifyPairingInfo(message, session.handshakeHash)) {
      console.warn('RememberCoordinator: pairing-info signature invalid; ignoring')
      return
    }
    const pending = computePendingPairing(
      this.deviceIdentity.publicKey,
      message,
      session.handshakeHash
    )
    const devicePubkeyHex = b4a.toString(pending.remoteDevicePubkey, 'hex')
    const known = await this.deps.rememberedStore.get(devicePubkeyHex)
    if (known) {
      if (!this.deps.getHandshakeHash(session.peerKey)) {
        return
      }

      this.deps.emit(createRememberConfirmedEvent(session.peerKey, known))
    }
    this.pendingPairings.set(session.peerKey, pending)
    const remote = this.remoteVotes.get(session.peerKey)

    if (remote?.decision === 'remember' && !this.ourVotes.has(session.peerKey)) {
      this.deps.emit(
        createRememberRequestedEvent({
          transferId: remote.transferId,
          peerKey: session.peerKey,
          displayName: pending.remoteDisplayName,
          deviceType: pending.remoteDeviceType
        })
      )
    }
    this.evaluateVote(session.peerKey)
  }

  handleRememberVote(message: RememberVote, peerKey: string): void {
    this.remoteVotes.set(peerKey, { decision: message.vote, transferId: message.transferId })
    if (message.vote === 'remember' && !this.ourVotes.has(peerKey)) {
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
    const { transferId, peerKey, vote, isMine } = input
    if (typeof transferId !== 'string' || transferId.length === 0) {
      throw new BadRequestError('rememberVote: transferId required')
    }
    if (typeof peerKey !== 'string' || peerKey.length === 0) {
      throw new BadRequestError('rememberVote: peerKey required')
    }
    if (vote !== 'remember' && vote !== 'no') {
      throw new BadRequestError('rememberVote: vote must be "remember" or "no"')
    }
    if (typeof isMine !== 'boolean') {
      throw new BadRequestError('rememberVote: isMine must be a boolean')
    }

    this.ourVotes.set(peerKey, { transferId, decision: vote, isMine })
    if (vote === 'remember') {
      this.startTimeout(peerKey, transferId)
      await this.deviceIdentityReady.catch(() => {})
      if (this.ourVotes.has(peerKey)) this.sendPairingInfo(peerKey)
    } else {
      this.clearTimer(peerKey)
    }
    this.deps.sendTo(peerKey, { type: 'remember-vote', transferId, vote, isMine })
    this.evaluateVote(peerKey)
    return { ok: true }
  }

  onPeerDisconnected(peerKey: string): void {
    const our = this.ourVotes.get(peerKey)
    const remote = this.remoteVotes.get(peerKey)

    if (our || remote) {
      this.deps.emit(
        createRememberDeclinedEvent(peerKey, our?.transferId ?? remote?.transferId ?? '')
      )
    }

    this.cleanupPeer(peerKey)
  }

  reset(): void {
    for (const peerKey of [...this.timers.keys()]) this.clearTimer(peerKey)

    this.ourVotes.clear()
    this.remoteVotes.clear()
    this.pendingPairings.clear()
    this.sentPairingInfo.clear()
  }

  private evaluateVote(peerKey: string): void {
    const our = this.ourVotes.get(peerKey)
    const remoteEntry = this.remoteVotes.get(peerKey)
    const remote =
      remoteEntry && remoteEntry.transferId === our?.transferId ? remoteEntry.decision : null
    const status = resolveVote(our ? { decision: our.decision, isMine: our.isMine } : null, remote)

    if (status === 'pending') return

    if (status === 'confirmed') {
      const pending = this.pendingPairings.get(peerKey)
      if (!pending || !our) return
      const peer = buildRememberedPeer(
        pending,
        { decision: our.decision, isMine: our.isMine },
        Date.now()
      )
      void this.deps.rememberedStore
        .remember(peer)
        .then((saved) => this.deps.emit(createRememberConfirmedEvent(peerKey, saved)))
        .catch((err) => console.warn('RememberCoordinator: failed to persist remembered peer', err))
    } else {
      this.deps.emit(createRememberDeclinedEvent(peerKey, our?.transferId ?? ''))
    }
    this.cleanupPeer(peerKey)
  }

  private sendPairingInfo(peerKey: string): void {
    if (this.sentPairingInfo.has(peerKey)) return
    if (!this.deviceIdentity) {
      console.warn('RememberCoordinator: device identity not ready; cannot send pairing-info')
      return
    }
    const handshakeHash = this.deps.getHandshakeHash(peerKey)
    if (!handshakeHash) {
      console.warn('RememberCoordinator: no handshake hash for peer; cannot send pairing-info')
      return
    }
    this.deps.sendTo(
      peerKey,
      buildPairingInfo(this.deviceIdentity, handshakeHash, { canBackground: false })
    )
    this.sentPairingInfo.add(peerKey)
  }

  private startTimeout(peerKey: string, transferId: string): void {
    this.clearTimer(peerKey)
    this.timers.set(
      peerKey,
      setTimeout(() => {
        this.timers.delete(peerKey)
        this.deps.emit(createRememberDeclinedEvent(peerKey, transferId))
        this.cleanupPeer(peerKey)
      }, REMEMBER_VOTE_TIMEOUT_MS)
    )
  }

  private clearTimer(peerKey: string): void {
    const timer = this.timers.get(peerKey)
    if (timer !== undefined) {
      clearTimeout(timer)
      this.timers.delete(peerKey)
    }
  }

  private cleanupPeer(peerKey: string): void {
    this.clearTimer(peerKey)
    this.ourVotes.delete(peerKey)
    this.remoteVotes.delete(peerKey)
    this.pendingPairings.delete(peerKey)
    this.sentPairingInfo.delete(peerKey)
  }
}
