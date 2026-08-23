import { describe, expect, it } from 'vitest'
import { initialTransferSessionState } from '../transfer/reducer'
import type { IncomingInvite, TransferSessionState } from '../transfer/types'
import type { RememberedPeer } from '@altersend/core'
import { canAutoAcceptInvite } from './autoAccept'

const PUBKEY = 'a'.repeat(64)

const peer = (remoteDevicePubkey: string): RememberedPeer => ({
  remoteDevicePubkey,
  rendezvousTopic: 'c'.repeat(64),
  displayName: 'My Laptop',
  deviceType: 'laptop',
  isMine: true,
  autoAccept: true,
  blocked: false,
  pairedAt: 1,
  lastSeenAt: 2
})

const invite: IncomingInvite = {
  remoteDevicePubkey: PUBKEY,
  displayName: 'My Laptop',
  deviceType: 'laptop',
  topic: 'b'.repeat(64)
}

const make = (overrides: Partial<TransferSessionState> = {}): TransferSessionState => ({
  ...initialTransferSessionState,
  peers: [peer(PUBKEY)],
  ...overrides
})

describe('canAutoAcceptInvite', () => {
  it('accepts an invite from a paired device when enabled', () => {
    expect(canAutoAcceptInvite(make(), invite, true)).toBe(true)
  })

  it('matches the paired device regardless of key casing', () => {
    const state = make({ peers: [peer(PUBKEY.toUpperCase())] })
    expect(canAutoAcceptInvite(state, invite, true)).toBe(true)
  })

  it('never accepts while disabled', () => {
    expect(canAutoAcceptInvite(make(), invite, false)).toBe(false)
  })

  it('ignores invites from devices that are not paired', () => {
    expect(canAutoAcceptInvite(make({ peers: [] }), invite, true)).toBe(false)
  })

  it('leaves the decision to the user while sharing or connected to a peer', () => {
    expect(canAutoAcceptInvite(make({ role: 'sender' }), invite, true)).toBe(false)
    expect(
      canAutoAcceptInvite(
        make({ role: 'receiver', connectionState: 'peer-connected' }),
        invite,
        true
      )
    ).toBe(false)
  })

  it('replaces a receive session that never reached a peer', () => {
    expect(
      canAutoAcceptInvite(make({ role: 'receiver', connectionState: 'joining' }), invite, true)
    ).toBe(true)
    expect(
      canAutoAcceptInvite(make({ role: 'receiver', connectionState: 'joined' }), invite, true)
    ).toBe(true)
  })

  it('leaves the decision to the user while files are staged to send', () => {
    const state = make({
      selectedFiles: [{ path: '/files/a.txt', name: 'a.txt', size: 1, kind: 'file' }]
    })
    expect(canAutoAcceptInvite(state, invite, true)).toBe(false)
  })
})
