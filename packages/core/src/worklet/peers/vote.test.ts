import { describe, it, expect } from 'vitest'
import b4a from 'b4a'
import crypto from 'hypercore-crypto'
import { resolveVote, buildRememberedPeer, type LocalVote } from './vote'
import type { PendingPairing } from './pairing'

describe('resolveVote', () => {
  const yes: LocalVote = { decision: 'remember', isMine: false }
  const no: LocalVote = { decision: 'no', isMine: false }

  it('stays pending until both sides vote', () => {
    expect(resolveVote(null, null)).toBe('pending')
    expect(resolveVote(yes, null)).toBe('pending')
    expect(resolveVote(null, 'remember')).toBe('pending')
  })

  it('confirms only when both vote remember', () => {
    expect(resolveVote(yes, 'remember')).toBe('confirmed')
  })

  it('declines immediately on a local no, before the remote votes', () => {
    expect(resolveVote(no, null)).toBe('declined')
  })

  it('declines immediately on a remote no', () => {
    expect(resolveVote(null, 'no')).toBe('declined')
    expect(resolveVote(yes, 'no')).toBe('declined')
  })
})

describe('buildRememberedPeer', () => {
  const pending: PendingPairing = {
    remoteDevicePubkey: crypto.keyPair().publicKey,
    remoteDisplayName: "Denis's MacBook",
    remoteDeviceType: 'laptop',
    remoteCanBackground: false,
    rendezvousTopic: crypto.randomBytes(32)
  }

  it('hex-encodes the key fields and copies advertised info', () => {
    const peer = buildRememberedPeer(pending, { decision: 'remember', isMine: false }, 1234)
    expect(peer.remoteDevicePubkey).toBe(b4a.toString(pending.remoteDevicePubkey, 'hex'))
    expect(peer.rendezvousTopic).toBe(b4a.toString(pending.rendezvousTopic, 'hex'))
    expect(peer.displayName).toBe("Denis's MacBook")
    expect(peer.deviceType).toBe('laptop')
    expect(peer.blocked).toBe(false)
    expect(peer.pairedAt).toBe(1234)
    expect(peer.lastSeenAt).toBe(1234)
  })

  it('seeds autoAccept from our own isMine choice', () => {
    expect(buildRememberedPeer(pending, { decision: 'remember', isMine: true }, 0).autoAccept).toBe(
      true
    )
    expect(
      buildRememberedPeer(pending, { decision: 'remember', isMine: false }, 0).autoAccept
    ).toBe(false)
  })
})
