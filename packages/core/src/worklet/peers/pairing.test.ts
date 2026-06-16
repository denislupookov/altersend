import { describe, it, expect } from 'vitest'
import b4a from 'b4a'
import crypto from 'hypercore-crypto'
import { buildPairingInfo, computePendingPairing, verifyPairingInfo } from './pairing'
import { deriveRendezvousTopic, HANDSHAKE_HASH_LEN } from './rendezvous'
import type { DeviceIdentity } from '../identity/device-identity-store'

function makeIdentity(overrides: Partial<DeviceIdentity> = {}): DeviceIdentity {
  const kp = crypto.keyPair()
  return {
    publicKey: kp.publicKey,
    secretKey: kp.secretKey,
    displayName: 'My Laptop',
    deviceType: 'laptop',
    createdAt: 0,
    ...overrides
  }
}

describe('buildPairingInfo', () => {
  it('serializes the device identity into a wire-safe card', () => {
    const id = makeIdentity()
    const handshakeHash = crypto.randomBytes(HANDSHAKE_HASH_LEN)
    const info = buildPairingInfo(id, handshakeHash, { canBackground: false })
    expect(info.type).toBe('pairing-info')
    expect(info.devicePubkey).toBe(b4a.toString(id.publicKey, 'hex'))
    expect(info.displayName).toBe('My Laptop')
    expect(info.deviceType).toBe('laptop')
    expect(info.capabilities).toEqual({ canBackground: false })
    expect(verifyPairingInfo(info, handshakeHash)).toBe(true)
  })
})

describe('verifyPairingInfo', () => {
  const id = makeIdentity()
  const handshakeHash = crypto.randomBytes(HANDSHAKE_HASH_LEN)
  const info = buildPairingInfo(id, handshakeHash, { canBackground: false })

  it('accepts a signature made for this handshake', () => {
    expect(verifyPairingInfo(info, handshakeHash)).toBe(true)
  })

  it('rejects a signature from a different handshake (no replay)', () => {
    const otherHandshake = crypto.randomBytes(HANDSHAKE_HASH_LEN)
    expect(verifyPairingInfo(info, otherHandshake)).toBe(false)
  })

  it('rejects when an impostor swaps in another device pubkey', () => {
    const impostor = buildPairingInfo(makeIdentity(), handshakeHash, { canBackground: false })
    const spoofed = { ...impostor, devicePubkey: info.devicePubkey }
    expect(verifyPairingInfo(spoofed, handshakeHash)).toBe(false)
  })
})

describe('computePendingPairing', () => {
  const local = makeIdentity()
  const remote = makeIdentity({ displayName: "Denis's iPhone", deviceType: 'phone' })
  const handshakeHash = crypto.randomBytes(HANDSHAKE_HASH_LEN)
  const remoteInfo = buildPairingInfo(remote, handshakeHash, { canBackground: true })

  it('carries the remote advertised info through', () => {
    const pending = computePendingPairing(local.publicKey, remoteInfo, handshakeHash)
    expect(b4a.equals(pending.remoteDevicePubkey, remote.publicKey)).toBe(true)
    expect(pending.remoteDisplayName).toBe("Denis's iPhone")
    expect(pending.remoteDeviceType).toBe('phone')
    expect(pending.remoteCanBackground).toBe(true)
  })

  it('derives the same rendezvous topic both peers would compute', () => {
    const pending = computePendingPairing(local.publicKey, remoteInfo, handshakeHash)
    const expected = deriveRendezvousTopic(local.publicKey, remote.publicKey, handshakeHash)
    expect(b4a.equals(pending.rendezvousTopic, expected)).toBe(true)
  })

  it('matches what the remote peer derives from its own perspective', () => {
    const localInfo = buildPairingInfo(local, handshakeHash, { canBackground: false })
    const mine = computePendingPairing(local.publicKey, remoteInfo, handshakeHash)
    const theirs = computePendingPairing(remote.publicKey, localInfo, handshakeHash)
    expect(b4a.equals(mine.rendezvousTopic, theirs.rendezvousTopic)).toBe(true)
  })
})
