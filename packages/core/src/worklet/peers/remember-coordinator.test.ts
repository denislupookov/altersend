import { describe, it, expect, vi } from 'vitest'
import b4a from 'b4a'
import crypto from 'hypercore-crypto'
import { RememberCoordinator, type RememberCoordinatorDeps } from './remember-coordinator'
import { buildPairingInfo } from './pairing'
import type { RememberedPeer } from './remembered-peer'
import type { DeviceIdentity } from '../identity/device-identity-store'
import type { PeerControlMessage } from '../transfer/control-channel'
import type { TransferIPCMessage } from '../rpc/events'

function makeIdentity(): DeviceIdentity {
  const kp = crypto.keyPair()
  return {
    publicKey: kp.publicKey,
    secretKey: kp.secretKey,
    displayName: 'Device',
    deviceType: 'laptop',
    createdAt: 0
  }
}

function setup(localIdentity: DeviceIdentity = makeIdentity()) {
  const broadcasts: PeerControlMessage[] = []
  const emits: TransferIPCMessage[] = []
  const remembered: RememberedPeer[] = []
  const deps: RememberCoordinatorDeps = {
    deviceIdentityStore: { getOrCreate: async () => localIdentity },
    rememberedStore: {
      remember: async (peer) => {
        remembered.push(peer)
        return peer
      }
    },
    broadcast: (m) => broadcasts.push(m),
    emit: (e) => emits.push(e)
  }
  return { coord: new RememberCoordinator(deps), broadcasts, emits, remembered, localIdentity }
}

const remote = makeIdentity()
const remoteKey = b4a.toString(remote.publicKey, 'hex')
const remoteInfo = buildPairingInfo(remote, { canBackground: false })
const handshake = crypto.randomBytes(32)
const flush = () => new Promise((r) => setTimeout(r, 0))

describe('RememberCoordinator.vote validation', () => {
  it('rejects bad input', async () => {
    const { coord } = setup()
    await expect(coord.vote({ transferId: '', vote: 'remember', isMine: true })).rejects.toThrow()
    await expect(
      coord.vote({ transferId: 't', vote: 'maybe' as never, isMine: true })
    ).rejects.toThrow()
    await expect(
      coord.vote({ transferId: 't', vote: 'remember', isMine: 'x' as never })
    ).rejects.toThrow()
  })
})

describe('RememberCoordinator two-sided vote', () => {
  it("on 'no' it broadcasts the vote and sends no pairing-info", async () => {
    const { coord, broadcasts } = setup()
    await coord.vote({ transferId: 't1', vote: 'no', isMine: false })
    expect(broadcasts).toEqual([{ type: 'remember-vote', transferId: 't1', vote: 'no', isMine: false }])
  })

  it('persists and emits confirmed when both sides vote remember', async () => {
    const { coord, broadcasts, emits, remembered } = setup()
    await coord.vote({ transferId: 't1', vote: 'remember', isMine: true })
    coord.handlePairingInfo(remoteInfo, { peerKey: remoteKey, handshakeHash: handshake })
    coord.handleRememberVote(
      { type: 'remember-vote', transferId: 't1', vote: 'remember', isMine: false },
      remoteKey
    )
    await flush()

    expect(broadcasts.some((m) => m.type === 'pairing-info')).toBe(true)
    expect(remembered).toHaveLength(1)
    expect(remembered[0].remoteDevicePubkey).toBe(remoteKey)
    expect(remembered[0].autoAccept).toBe(true) // seeded from our isMine
    expect(emits.some((e) => e.type === 'remember-confirmed')).toBe(true)
    coord.reset()
  })

  it("declines immediately on the remote's 'no', without persisting", async () => {
    const { coord, emits, remembered } = setup()
    await coord.vote({ transferId: 't1', vote: 'remember', isMine: false })
    coord.handleRememberVote(
      { type: 'remember-vote', transferId: 't1', vote: 'no', isMine: false },
      remoteKey
    )
    await flush()
    expect(remembered).toHaveLength(0)
    expect(emits.some((e) => e.type === 'remember-declined')).toBe(true)
    coord.reset()
  })

  it('ignores a remote vote from a different transfer (no cross-round confirm)', async () => {
    const { coord, remembered } = setup()
    await coord.vote({ transferId: 't1', vote: 'remember', isMine: false })
    coord.handlePairingInfo(remoteInfo, { peerKey: remoteKey, handshakeHash: handshake })
    coord.handleRememberVote(
      { type: 'remember-vote', transferId: 't2', vote: 'remember', isMine: false },
      remoteKey
    )
    await flush()
    expect(remembered).toHaveLength(0)
    coord.reset()
  })

  it('declines after the 60s window if the peer never votes', async () => {
    vi.useFakeTimers()
    try {
      const { coord, emits } = setup()
      await coord.vote({ transferId: 't1', vote: 'remember', isMine: true })
      await vi.advanceTimersByTimeAsync(60_000)
      expect(emits.some((e) => e.type === 'remember-declined')).toBe(true)
    } finally {
      vi.useRealTimers()
    }
  })
})
