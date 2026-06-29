import { describe, it, expect } from 'vitest'
import { type RememberedPeer, isValidRememberedPeer, mergeRememberedPeer } from './remembered-peer'

const KEY_A = 'a'.repeat(64)

function makePeer(overrides: Partial<RememberedPeer> = {}): RememberedPeer {
  return {
    remoteDevicePubkey: KEY_A,
    rendezvousTopic: 'c'.repeat(64),
    displayName: "Denis's MacBook",
    deviceType: 'laptop',
    isMine: false,
    autoAccept: false,
    blocked: false,
    pairedAt: 1000,
    lastSeenAt: 1000,
    ...overrides
  }
}

describe('isValidRememberedPeer', () => {
  it('accepts a well-formed peer', () => {
    expect(isValidRememberedPeer(makePeer())).toBe(true)
  })

  it('rejects bad pubkey / topic hex', () => {
    expect(isValidRememberedPeer(makePeer({ remoteDevicePubkey: 'nope' }))).toBe(false)
    expect(isValidRememberedPeer(makePeer({ rendezvousTopic: 'a'.repeat(63) }))).toBe(false)
  })

  it('rejects an unknown device type', () => {
    expect(isValidRememberedPeer(makePeer({ deviceType: 'toaster' as never }))).toBe(false)
  })

  it('rejects non-boolean flags and empty name', () => {
    expect(isValidRememberedPeer(makePeer({ autoAccept: 'yes' as never }))).toBe(false)
    expect(isValidRememberedPeer(makePeer({ displayName: '' }))).toBe(false)
  })

  it('rejects null / non-object', () => {
    expect(isValidRememberedPeer(null)).toBe(false)
    expect(isValidRememberedPeer('peer')).toBe(false)
  })
})

describe('mergeRememberedPeer', () => {
  it('returns the incoming record verbatim on first pairing (no existing)', () => {
    const incoming = makePeer()
    expect(mergeRememberedPeer(null, incoming)).toBe(incoming)
  })

  it('preserves user settings on re-pair, refreshing only crypto + last-seen', () => {
    const existing = makePeer({
      displayName: 'Renamed',
      deviceType: 'phone',
      isMine: true,
      autoAccept: true,
      blocked: true,
      rendezvousTopic: '1'.repeat(64),
      pairedAt: 100,
      lastSeenAt: 100
    })
    const incoming = makePeer({
      displayName: 'Advertised',
      deviceType: 'laptop',
      isMine: false,
      autoAccept: false,
      blocked: false,
      rendezvousTopic: '2'.repeat(64),
      pairedAt: 999,
      lastSeenAt: 999
    })
    const merged = mergeRememberedPeer(existing, incoming)
    expect(merged.displayName).toBe('Renamed')
    expect(merged.isMine).toBe(true)
    expect(merged.autoAccept).toBe(true)
    expect(merged.blocked).toBe(true)
    expect(merged.pairedAt).toBe(100)
    expect(merged.deviceType).toBe('laptop')
    expect(merged.rendezvousTopic).toBe('2'.repeat(64))
    expect(merged.lastSeenAt).toBe(999)
  })
})
