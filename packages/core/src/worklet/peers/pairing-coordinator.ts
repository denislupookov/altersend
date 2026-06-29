import { TransferSwarm, type PeerSession } from '../transfer/swarm'
import type { PeerIdentityStore } from '../transfer/peer-identity-store'
import type { PeerControlMessage } from '../transfer/control-channel'
import { isValidHexKey } from '../transfer/utils'
import { RememberCoordinator } from './remember-coordinator'
import type { RememberedPeerStore } from './store'
import type { DeviceIdentityStore } from '../identity/device-identity-store'
import {
  createPairingPeerConnectedEvent,
  TRANSFER_ERROR_CODES,
  type TransferIPCMessage
} from '../rpc/events'
import {
  BadRequestError,
  type HostReply,
  type JoinReply,
  type RememberVoteInput,
  type RememberVoteReply
} from '../rpc/protocol'

export interface PairingCoordinatorDeps {
  identityStore: PeerIdentityStore
  deviceIdentityStore: DeviceIdentityStore
  rememberedStore: RememberedPeerStore
  emit: (event: TransferIPCMessage) => void
  onRememberConfirmed: () => void
}

export class PairingCoordinator {
  private readonly swarm: TransferSwarm
  private readonly remember: RememberCoordinator
  private readonly emit: (event: TransferIPCMessage) => void
  private topic: string | null = null
  private isMine = false

  constructor(deps: PairingCoordinatorDeps) {
    this.emit = deps.emit
    this.swarm = new TransferSwarm(
      {
        onReady: () => Promise.resolve(),
        onReplicate: () => {},
        onPeerConnected: (session) => this.onPeerConnected(session),
        onPeerDisconnected: (peerKey) => this.onPeerDisconnected(peerKey),
        onControlMessage: (message, session) => this.onControlMessage(message, session)
      },
      { identityStore: deps.identityStore }
    )
    this.remember = new RememberCoordinator({
      deviceIdentityStore: deps.deviceIdentityStore,
      rememberedStore: deps.rememberedStore,
      sendTo: (peerKey, message) => this.swarm.sendTo(peerKey, message),
      getHandshakeHash: (peerKey) => this.swarm.getHandshakeHash(peerKey),
      emit: (event) => {
        this.emit(event)
        if (event.type === 'remember-confirmed') deps.onRememberConfirmed()
      }
    })
  }

  async host(): Promise<HostReply> {
    const topic = this.swarm.generateKey()
    this.topic = topic
    this.isMine = false
    return { topic }
  }

  async join(topic: string): Promise<JoinReply> {
    if (typeof topic !== 'string' || !isValidHexKey(topic)) {
      throw new BadRequestError('Invalid topic format', TRANSFER_ERROR_CODES.invalidTopic)
    }
    this.topic = topic
    this.isMine = false
    await this.swarm.join(topic)
    return { state: 'joined' }
  }

  async destroy(): Promise<void> {
    this.topic = null
    this.remember.reset()
    await this.swarm.destroy()
  }

  vote(input: RememberVoteInput): Promise<RememberVoteReply> {
    return this.remember.vote(input)
  }

  private onPeerConnected(session: PeerSession): void {
    this.emit(createPairingPeerConnectedEvent(session.peerKey))
    this.remember.onPeerConnected(session.peerKey)
    if (this.topic) {
      void this.remember.vote({
        transferId: this.topic,
        peerKey: session.peerKey,
        vote: 'remember',
        isMine: this.isMine
      })
    }
  }

  private onPeerDisconnected(peerKey: string | null): void {
    if (peerKey) this.remember.onPeerDisconnected(peerKey)
  }

  private onControlMessage(message: PeerControlMessage, session: PeerSession): void {
    if (message.type === 'pairing-info') {
      void this.remember.handlePairingInfo(message, session)
      return
    }
    if (message.type === 'remember-vote') {
      this.remember.handleRememberVote(message, session.peerKey)
    }
  }
}
