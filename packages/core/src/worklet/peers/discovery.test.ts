import { describe, it, expect, vi, beforeEach } from 'vitest'
import b4a from 'b4a'
import crypto from 'hypercore-crypto'
import type { PeerInfo, PeerSocket } from 'hyperswarm'
import {
  DiscoveryCoordinator,
  INVITE_WAIT_MS,
  type DiscoveryDeps,
  type DiscoverySwarm
} from './discovery'
import type { RememberedPeer } from './remembered-peer'
import type { DeviceIdentity } from '../identity/device-identity-store'
import type { TransferIPCMessage } from '../rpc/events'

const { channels } = vi.hoisted(() => ({
  channels: [] as Array<{ send: ReturnType<typeof vi.fn>; onmessage: (m: unknown) => void }>
}))

vi.mock('../transfer/control-channel', async (importActual) => {
  const actual = await importActual<typeof import('../transfer/control-channel')>()
  return {
    ...actual,
    PeerControlChannel: {
      create: (_socket: unknown, onmessage: (m: unknown) => void) => {
        const channel = { send: vi.fn(), onmessage }
        channels.push(channel)
        return channel
      }
    }
  }
})

const hex = (bytes: Uint8Array): string => b4a.toString(bytes, 'hex')
const flush = (): Promise<void> => new Promise((resolve) => setTimeout(resolve, 0))

function makeIdentity(): DeviceIdentity {
  const kp = crypto.keyPair()
  return {
    publicKey: kp.publicKey,
    secretKey: kp.secretKey,
    displayName: 'My Device',
    deviceType: 'laptop',
    createdAt: 0
  }
}

function makePeer(): RememberedPeer {
  return {
    remoteDevicePubkey: hex(crypto.randomBytes(32)),
    rendezvousTopic: hex(crypto.randomBytes(32)),
    displayName: 'Phone',
    deviceType: 'phone',
    isMine: true,
    autoAccept: false,
    blocked: false,
    pairedAt: 0,
    lastSeenAt: 0
  }
}

function setup(peers: RememberedPeer[] = []) {
  const emits: TransferIPCMessage[] = []
  const joins: Uint8Array[] = []
  const destroy = vi.fn(async () => {})
  const touch = vi.fn(async () => null)
  let firewall: ((pk: Uint8Array) => boolean) | null = null
  let onConnection: ((socket: PeerSocket, info: PeerInfo) => void) | null = null

  const swarm: DiscoverySwarm = {
    on: (_event, listener) => {
      onConnection = listener
      return swarm
    },
    join: (discoveryKey) => {
      joins.push(discoveryKey)
      return undefined
    },
    destroy
  }

  const deps: DiscoveryDeps = {
    deviceIdentityStore: { getOrCreate: async () => makeIdentity() },
    rememberedStore: {
      list: async () => peers,
      get: async (pk) => peers.find((p) => p.remoteDevicePubkey === pk) ?? null,
      touch
    },
    emit: (e) => emits.push(e),
    createSwarm: (opts) => {
      firewall = opts.firewall
      return swarm
    }
  }

  const coordinator = new DiscoveryCoordinator(deps)
  const connect = (pubkeyHex: string): PeerSocket => {
    const socket = { destroy: vi.fn(), on: vi.fn() } as unknown as PeerSocket
    onConnection?.(socket, { publicKey: b4a.from(pubkeyHex, 'hex') })
    return socket
  }

  return { coordinator, emits, joins, destroy, touch, connect, getFirewall: () => firewall }
}

describe('DiscoveryCoordinator', () => {
  beforeEach(() => {
    channels.length = 0
  })

  it('firewall blocks unknown peers and allows remembered ones', async () => {
    const peer = makePeer()
    const { coordinator, getFirewall, joins } = setup([peer])
    await coordinator.start()

    const firewall = getFirewall()
    expect(firewall).toBeTruthy()
    expect(firewall!(b4a.from(peer.remoteDevicePubkey, 'hex'))).toBe(false)
    expect(firewall!(crypto.randomBytes(32))).toBe(true)
    expect(joins).toHaveLength(1)
  })

  it('destroys connections from unknown peers without opening a channel', async () => {
    const { coordinator, connect, touch } = setup([])
    await coordinator.start()

    const socket = connect(hex(crypto.randomBytes(32)))
    expect(socket.destroy).toHaveBeenCalled()
    expect(channels).toHaveLength(0)
    expect(touch).not.toHaveBeenCalled()
  })

  it('updates lastSeenAt when a remembered peer connects', async () => {
    const peer = makePeer()
    const { coordinator, connect, touch } = setup([peer])
    await coordinator.start()

    connect(peer.remoteDevicePubkey)
    expect(touch).toHaveBeenCalledWith(peer.remoteDevicePubkey, expect.any(Number))
  })

  it('invite resolves and sends once the remembered peer connects', async () => {
    const peer = makePeer()
    const { coordinator, connect } = setup([peer])
    await coordinator.start()

    const topic = hex(crypto.randomBytes(32))
    const invitePromise = coordinator.invite(peer.remoteDevicePubkey, topic, 3, 2, 1024)
    await flush()

    connect(peer.remoteDevicePubkey)
    expect(await invitePromise).toEqual({ delivered: true })
    expect(channels).toHaveLength(1)
    expect(channels[0].send).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'invite',
        topic,
        fileCount: 3,
        textCount: 2,
        totalSize: 1024
      })
    )
  })

  it('invite returns delivered:false when no peer connects before the timeout', async () => {
    vi.useFakeTimers()
    try {
      const peer = makePeer()
      const { coordinator } = setup([peer])
      const invitePromise = coordinator.invite(peer.remoteDevicePubkey, hex(crypto.randomBytes(32)))
      await vi.advanceTimersByTimeAsync(INVITE_WAIT_MS + 100)
      expect(await invitePromise).toEqual({ delivered: false })
    } finally {
      vi.useRealTimers()
    }
  })

  it('stop() drains pending invites and tears down the swarm', async () => {
    const peer = makePeer()
    const { coordinator, destroy } = setup([peer])
    await coordinator.start()

    const invitePromise = coordinator.invite(peer.remoteDevicePubkey, hex(crypto.randomBytes(32)))
    await flush()

    await coordinator.stop()
    expect(await invitePromise).toEqual({ delivered: false })
    expect(destroy).toHaveBeenCalled()
  })

  it('respondToInvite sends a decline once the peer connects', async () => {
    const peer = makePeer()
    const { coordinator, connect } = setup([peer])
    await coordinator.start()

    const topic = hex(crypto.randomBytes(32))
    const respondPromise = coordinator.respondToInvite(peer.remoteDevicePubkey, topic, 'declined')
    await flush()

    connect(peer.remoteDevicePubkey)
    expect(await respondPromise).toEqual({ delivered: true })
    expect(channels[0].send).toHaveBeenCalledWith({
      type: 'invite-response',
      topic,
      response: 'declined'
    })
  })

  it('emits an event when an invite arrives over the control channel', async () => {
    const peer = makePeer()
    const { coordinator, connect, emits } = setup([peer])
    await coordinator.start()

    connect(peer.remoteDevicePubkey)
    channels[0].onmessage({
      type: 'invite',
      displayName: 'Phone',
      deviceType: 'phone',
      topic: hex(crypto.randomBytes(32))
    })

    expect(emits).toHaveLength(1)
    expect(emits[0]).toMatchObject({
      type: 'invite-received',
      remoteDevicePubkey: peer.remoteDevicePubkey
    })
  })
})
