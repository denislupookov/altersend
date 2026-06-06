import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { PeerIdentityStore } from './peer-identity-store'

const mockState = vi.hoisted(() => ({
  instances: [] as Array<{
    opts: unknown
    join: ReturnType<typeof vi.fn>
    destroy: ReturnType<typeof vi.fn>
  }>,
  joins: [] as Array<{ discovery: Uint8Array; opts: unknown }>
}))

vi.mock('hyperswarm', () => ({
  default: class MockHyperswarm {
    readonly opts: unknown
    readonly join = vi.fn((discovery: Uint8Array, opts: unknown) => {
      mockState.joins.push({ discovery, opts })
    })
    readonly destroy = vi.fn(async () => {})

    constructor(opts?: unknown) {
      this.opts = opts
      mockState.instances.push(this)
    }

    on() {
      return this
    }
  }
}))

const { TransferSwarm } = await import('./swarm')

const callbacks = {
  onReady: async () => {},
  onReplicate: () => {},
  onPeerConnected: () => {},
  onPeerDisconnected: () => {},
  onControlMessage: () => {}
}

const topic = 'a'.repeat(64)
const keyPair = {
  publicKey: new Uint8Array(32).fill(1),
  secretKey: new Uint8Array(64).fill(2)
}

describe('TransferSwarm.join', () => {
  beforeEach(() => {
    vi.useRealTimers()
    mockState.instances.length = 0
    mockState.joins.length = 0
  })

  it('uses a stored identity keypair when it resolves quickly', async () => {
    const identityStore = {
      getOrCreate: vi.fn(async () => keyPair)
    } as unknown as PeerIdentityStore
    const swarm = new TransferSwarm(callbacks, { identityStore })

    await swarm.join(topic)

    expect(identityStore.getOrCreate).toHaveBeenCalledWith(topic)
    expect(mockState.instances[0]?.opts).toEqual({ keyPair })
    expect(mockState.joins).toHaveLength(1)
  })

  it('joins with an ephemeral keypair when identity persistence rejects', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const identityStore = {
      getOrCreate: vi.fn(async () => {
        throw new Error('storage unavailable')
      })
    } as unknown as PeerIdentityStore
    const swarm = new TransferSwarm(callbacks, { identityStore })

    await swarm.join(topic)

    expect(mockState.instances[0]?.opts).toBeUndefined()
    expect(mockState.joins).toHaveLength(1)
    warn.mockRestore()
  })

  it('does not block joining forever when identity persistence stalls', async () => {
    vi.useFakeTimers()
    const identityStore = {
      getOrCreate: vi.fn(() => new Promise(() => {}))
    } as unknown as PeerIdentityStore
    const swarm = new TransferSwarm(callbacks, { identityStore })

    const joining = swarm.join(topic)
    await vi.advanceTimersByTimeAsync(501)
    await joining

    expect(mockState.instances[0]?.opts).toBeUndefined()
    expect(mockState.joins).toHaveLength(1)
  })
})
