import b4a from 'b4a'
import { buildRecognition, verifyRecognition } from './pairing'
import type { RememberedPeer } from './remembered-peer'
import type { DeviceIdentity } from '../identity/device-identity-store'
import type { PeerControlMessage, Recognition } from '../transfer/control-channel'
import { createRememberConfirmedEvent, type TransferIPCMessage } from '../rpc/events'

export interface RecognitionCoordinatorDeps {
  deviceIdentityStore: { getOrCreate(): Promise<DeviceIdentity> }
  rememberedStore: { list(): Promise<RememberedPeer[]> }
  sendTo: (peerKey: string, message: PeerControlMessage) => void
  getHandshakeHash: (peerKey: string) => Uint8Array | null
  emit: (event: TransferIPCMessage) => void
}

export class RecognitionCoordinator {
  private readonly deps: RecognitionCoordinatorDeps
  private readonly deviceIdentityReady: Promise<DeviceIdentity>
  private deviceIdentity: DeviceIdentity | null = null
  private readonly sent = new Set<string>()

  constructor(deps: RecognitionCoordinatorDeps) {
    this.deps = deps
    this.deviceIdentityReady = deps.deviceIdentityStore.getOrCreate()
    this.deviceIdentityReady
      .then((identity) => {
        this.deviceIdentity = identity
      })
      .catch((err) => console.warn('RecognitionCoordinator: device identity init failed', err))
  }

  onPeerConnected(peerKey: string): void {
    this.deviceIdentityReady.then(() => this.sendRecognition(peerKey)).catch(() => {})
  }

  async handleRecognition(message: Recognition, peerKey: string): Promise<void> {
    const handshakeHash = this.deps.getHandshakeHash(peerKey)
    if (!handshakeHash) return
    try {
      const peers = await this.deps.rememberedStore.list()
      for (const peer of peers) {
        if (verifyRecognition(message, handshakeHash, b4a.from(peer.remoteDevicePubkey, 'hex'))) {
          this.deps.emit(createRememberConfirmedEvent(peerKey, peer))
          return
        }
      }
    } catch (err) {
      console.warn('RecognitionCoordinator: handleRecognition failed', err)
    }
  }

  onPeerDisconnected(peerKey: string): void {
    this.sent.delete(peerKey)
  }

  reset(): void {
    this.sent.clear()
  }

  private sendRecognition(peerKey: string): void {
    if (this.sent.has(peerKey) || !this.deviceIdentity) return
    const handshakeHash = this.deps.getHandshakeHash(peerKey)
    if (!handshakeHash) return
    this.deps.sendTo(peerKey, buildRecognition(this.deviceIdentity, handshakeHash))
    this.sent.add(peerKey)
  }
}
