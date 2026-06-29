import { describe, it, expect } from 'vitest'
import b4a from 'b4a'
import crypto from 'hypercore-crypto'
import { RecognitionCoordinator, type RecognitionCoordinatorDeps } from './recognition-coordinator'
import { buildRecognition, verifyRecognition } from './pairing'
import type { RememberedPeer } from './remembered-peer'
import type { DeviceIdentity } from '../identity/device-identity-store'
import type { PeerControlMessage, Recognition } from '../transfer/control-channel'
import type { TransferIPCMessage } from '../rpc/events'

const handshake = crypto.randomBytes(64)
const hex = (bytes: Uint8Array): string => b4a.toString(bytes, 'hex')
const flush = (): Promise<void> => new Promise((resolve) => setTimeout(resolve, 0))

function makeIdentity(displayName = 'Device'): DeviceIdentity {
  const kp = crypto.keyPair()
  return {
    publicKey: kp.publicKey,
    secretKey: kp.secretKey,
    displayName,
    deviceType: 'laptop',
    createdAt: 0
  }
}

function rememberedFrom(identity: DeviceIdentity, displayName: string): RememberedPeer {
  return {
    remoteDevicePubkey: hex(identity.publicKey),
    rendezvousTopic: hex(crypto.randomBytes(32)),
    displayName,
    deviceType: 'phone',
    isMine: false,
    autoAccept: false,
    blocked: false,
    pairedAt: 0,
    lastSeenAt: 0
  }
}

function setup(remembered: RememberedPeer[] = [], local: DeviceIdentity = makeIdentity()) {
  const sends: { peerKey: string; message: PeerControlMessage }[] = []
  const emits: TransferIPCMessage[] = []
  const deps: RecognitionCoordinatorDeps = {
    deviceIdentityStore: { getOrCreate: async () => local },
    rememberedStore: { list: async () => remembered },
    sendTo: (peerKey, message) => sends.push({ peerKey, message }),
    getHandshakeHash: () => handshake,
    emit: (e) => emits.push(e)
  }
  return { coordinator: new RecognitionCoordinator(deps), sends, emits, local }
}

describe('RecognitionCoordinator', () => {
  it('on connect, sends only a signature (no pubkey or name) that verifies against our key', async () => {
    const { coordinator, sends, local } = setup()
    coordinator.onPeerConnected('peer-1')
    await flush()

    expect(sends).toHaveLength(1)
    const msg = sends[0].message as Recognition
    expect(msg.type).toBe('recognition')
    expect(Object.keys(msg).sort()).toEqual(['signature', 'type'])
    expect(verifyRecognition(msg, handshake, local.publicKey)).toBe(true)
  })

  it('recognizes a remembered peer and emits remember-confirmed with the stored record', async () => {
    const peerIdentity = makeIdentity()
    const peer = rememberedFrom(peerIdentity, 'My Phone')
    const { coordinator, emits } = setup([peer])

    await coordinator.handleRecognition(buildRecognition(peerIdentity, handshake), 'peer-1')

    expect(emits).toHaveLength(1)
    expect(emits[0]).toEqual({ type: 'remember-confirmed', peerKey: 'peer-1', peer })
  })

  it('ignores a recognition from a non-paired peer (stranger learns nothing, we emit nothing)', async () => {
    const known = makeIdentity()
    const stranger = makeIdentity()
    const { coordinator, emits } = setup([rememberedFrom(known, 'My Phone')])

    await coordinator.handleRecognition(buildRecognition(stranger, handshake), 'peer-1')

    expect(emits).toHaveLength(0)
  })

  it('does not match a remembered peer when the signature is over a different handshake', async () => {
    const peerIdentity = makeIdentity()
    const { coordinator, emits } = setup([rememberedFrom(peerIdentity, 'My Phone')])

    const wrongHandshake = crypto.randomBytes(64)
    await coordinator.handleRecognition(buildRecognition(peerIdentity, wrongHandshake), 'peer-1')

    expect(emits).toHaveLength(0)
  })

  it('only sends recognition once per peer', async () => {
    const { coordinator, sends } = setup()
    coordinator.onPeerConnected('peer-1')
    await flush()
    coordinator.onPeerConnected('peer-1')
    await flush()

    expect(sends).toHaveLength(1)
  })
})
