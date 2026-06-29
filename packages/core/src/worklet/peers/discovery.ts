import b4a from 'b4a'
import crypto from 'hypercore-crypto'
import Hyperswarm, { type NoiseKeyPair, type PeerInfo, type PeerSocket } from 'hyperswarm'
import { PeerControlChannel } from '../transfer/control-channel'
import type {
  DeviceInvite,
  DeviceInviteResponse,
  PeerControlMessage
} from '../transfer/control-channel'
import type { DeviceIdentity } from '../identity/device-identity-store'
import type { RememberedPeer } from './remembered-peer'
import {
  createInviteReceivedEvent,
  createInviteResponseReceivedEvent,
  type TransferIPCMessage
} from '../rpc/events'
import { BadRequestError, type InviteDeviceReply, type InviteResponseReply } from '../rpc/protocol'

export const INVITE_WAIT_MS = 30_000

export interface DiscoverySwarm {
  on(event: 'connection', listener: (socket: PeerSocket, info: PeerInfo) => void): unknown
  join(discoveryKey: Uint8Array, opts?: { server?: boolean; client?: boolean }): unknown
  destroy(): Promise<void>
}

type CreateDiscoverySwarm = (opts: {
  keyPair: NoiseKeyPair
  firewall: (remotePublicKey: Uint8Array) => boolean
}) => DiscoverySwarm

export interface DiscoveryDeps {
  deviceIdentityStore: { getOrCreate(): Promise<DeviceIdentity> }
  rememberedStore: {
    list(): Promise<RememberedPeer[]>
    get(pubkeyHex: string): Promise<RememberedPeer | null>
    touch(pubkeyHex: string, lastSeenAt: number): Promise<RememberedPeer | null>
  }
  emit: (event: TransferIPCMessage) => void
  createSwarm?: CreateDiscoverySwarm
}

interface DiscoverySession {
  socket: PeerSocket
  control: PeerControlChannel
}

interface SessionWaiter {
  resolve: (session: DiscoverySession | null) => void
  timer: ReturnType<typeof setTimeout>
}

const normalizeKey = (hex: string): string => hex.toLowerCase()

export class DiscoveryCoordinator {
  private readonly deps: DiscoveryDeps
  private swarm: DiscoverySwarm | null = null
  private readonly sessions = new Map<string, DiscoverySession>()
  private readonly sessionWaiters = new Map<string, Set<SessionWaiter>>()
  private readonly joinedTopics = new Set<string>()
  private readonly knownPubkeys = new Set<string>()
  private starting: Promise<void> | null = null

  constructor(deps: DiscoveryDeps) {
    this.deps = deps
  }

  start(): Promise<void> {
    if (this.starting) return this.starting
    this.starting = this.doStart().catch((err) => {
      this.starting = null
      console.warn('DiscoveryCoordinator: start failed', err)
    })
    return this.starting
  }

  private async doStart(): Promise<void> {
    const identity = await this.deps.deviceIdentityStore.getOrCreate()
    const peers = await this.deps.rememberedStore.list()
    for (const peer of peers) this.knownPubkeys.add(normalizeKey(peer.remoteDevicePubkey))

    if (this.swarm) return
    const createSwarm = this.deps.createSwarm ?? ((opts) => new Hyperswarm(opts))
    this.swarm = createSwarm({
      keyPair: { publicKey: identity.publicKey, secretKey: identity.secretKey },
      firewall: (remotePublicKey) =>
        !this.knownPubkeys.has(normalizeKey(b4a.toString(remotePublicKey, 'hex')))
    })
    this.swarm.on('connection', (socket, info) => {
      this.handleConnection(socket, info)
    })
    for (const peer of peers) this.joinTopic(peer.rendezvousTopic)
  }

  async refresh(): Promise<void> {
    if (!this.swarm) return this.start()
    const peers = await this.deps.rememberedStore.list()
    for (const peer of peers) {
      this.knownPubkeys.add(normalizeKey(peer.remoteDevicePubkey))
      this.joinTopic(peer.rendezvousTopic)
    }
  }

  async invite(
    remoteDevicePubkey: string,
    topic: string,
    fileCount?: number,
    totalSize?: number
  ): Promise<InviteDeviceReply> {
    if (typeof remoteDevicePubkey !== 'string' || remoteDevicePubkey.length === 0) {
      throw new BadRequestError('inviteDevice: remoteDevicePubkey required')
    }
    if (typeof topic !== 'string' || topic.length === 0) {
      throw new BadRequestError('inviteDevice: topic required')
    }
    const peer = await this.deps.rememberedStore.get(remoteDevicePubkey)
    if (!peer) throw new BadRequestError('inviteDevice: unknown device')

    await this.start()
    this.knownPubkeys.add(normalizeKey(peer.remoteDevicePubkey))
    this.joinTopic(peer.rendezvousTopic)

    const session = await this.waitForSession(normalizeKey(peer.remoteDevicePubkey))
    if (!session) return { delivered: false }

    const identity = await this.deps.deviceIdentityStore.getOrCreate()
    const message: DeviceInvite = {
      type: 'invite',
      displayName: identity.displayName,
      deviceType: identity.deviceType,
      topic,
      ...(fileCount !== undefined ? { fileCount } : {}),
      ...(totalSize !== undefined ? { totalSize } : {})
    }
    session.control.send(message)
    return { delivered: true }
  }

  async respondToInvite(
    remoteDevicePubkey: string,
    topic: string,
    response: DeviceInviteResponse['response']
  ): Promise<InviteResponseReply> {
    if (typeof remoteDevicePubkey !== 'string' || remoteDevicePubkey.length === 0) {
      throw new BadRequestError('respondToInvite: remoteDevicePubkey required')
    }
    if (typeof topic !== 'string' || topic.length === 0) {
      throw new BadRequestError('respondToInvite: topic required')
    }
    if (response !== 'declined') {
      throw new BadRequestError('respondToInvite: unsupported response')
    }

    const peer = await this.deps.rememberedStore.get(remoteDevicePubkey)
    if (!peer) throw new BadRequestError('respondToInvite: unknown device')

    await this.start()
    this.knownPubkeys.add(normalizeKey(peer.remoteDevicePubkey))
    this.joinTopic(peer.rendezvousTopic)

    const session = await this.waitForSession(normalizeKey(peer.remoteDevicePubkey))
    if (!session) return { delivered: false }

    session.control.send({ type: 'invite-response', topic, response })
    return { delivered: true }
  }

  forget(remoteDevicePubkey: string): void {
    const key = normalizeKey(remoteDevicePubkey)
    this.knownPubkeys.delete(key)
    const session = this.sessions.get(key)
    if (!session) return
    this.sessions.delete(key)
    try {
      session.socket.destroy()
    } catch {}
  }

  async stop(): Promise<void> {
    this.starting = null
    for (const waiters of this.sessionWaiters.values()) {
      for (const waiter of waiters) {
        clearTimeout(waiter.timer)
        waiter.resolve(null)
      }
    }
    this.sessionWaiters.clear()
    for (const { socket } of this.sessions.values()) {
      try {
        socket.destroy()
      } catch {}
    }
    this.sessions.clear()
    this.joinedTopics.clear()
    const swarm = this.swarm
    this.swarm = null
    if (swarm) await swarm.destroy().catch(() => {})
  }

  private joinTopic(topicHex: string): void {
    if (!this.swarm || this.joinedTopics.has(topicHex)) return
    this.joinedTopics.add(topicHex)
    const discovery = crypto.discoveryKey(b4a.from(topicHex, 'hex'))
    this.swarm.join(discovery, { server: true, client: true })
  }

  private handleConnection(socket: PeerSocket, info: PeerInfo): void {
    const remotePubkey = normalizeKey(b4a.toString(info.publicKey, 'hex'))
    if (!this.knownPubkeys.has(remotePubkey)) {
      try {
        socket.destroy()
      } catch {}
      return
    }

    const control = PeerControlChannel.create(socket, (message) =>
      this.onControlMessage(remotePubkey, message)
    )
    if (!control) {
      try {
        socket.destroy()
      } catch {}
      return
    }

    const previous = this.sessions.get(remotePubkey)
    if (previous && previous.socket !== socket) {
      try {
        previous.socket.destroy()
      } catch {}
    }
    const session = { socket, control }
    this.sessions.set(remotePubkey, session)
    this.resolveSessionWaiters(remotePubkey, session)
    void this.deps.rememberedStore.touch(remotePubkey, Date.now()).catch(() => {})

    const drop = () => {
      if (this.sessions.get(remotePubkey)?.socket === socket) this.sessions.delete(remotePubkey)
    }
    socket.on('close', drop)
    socket.on('error', drop)
  }

  private onControlMessage(remotePubkey: string, message: PeerControlMessage): void {
    if (message.type === 'invite') {
      this.deps.emit(
        createInviteReceivedEvent({
          remoteDevicePubkey: remotePubkey,
          displayName: message.displayName,
          deviceType: message.deviceType,
          topic: message.topic,
          ...(message.fileCount !== undefined ? { fileCount: message.fileCount } : {}),
          ...(message.totalSize !== undefined ? { totalSize: message.totalSize } : {})
        })
      )
      return
    }
    if (message.type === 'invite-response') {
      this.deps.emit(
        createInviteResponseReceivedEvent({
          remoteDevicePubkey: remotePubkey,
          topic: message.topic,
          response: message.response
        })
      )
    }
  }

  private waitForSession(remotePubkey: string): Promise<DiscoverySession | null> {
    const existing = this.sessions.get(remotePubkey)
    if (existing) return Promise.resolve(existing)
    return new Promise((resolve) => {
      const waiters = this.sessionWaiters.get(remotePubkey) ?? new Set<SessionWaiter>()
      this.sessionWaiters.set(remotePubkey, waiters)
      const waiter: SessionWaiter = {
        resolve,
        timer: setTimeout(() => {
          waiters.delete(waiter)
          if (waiters.size === 0) this.sessionWaiters.delete(remotePubkey)
          resolve(null)
        }, INVITE_WAIT_MS)
      }
      waiters.add(waiter)
    })
  }

  private resolveSessionWaiters(remotePubkey: string, session: DiscoverySession): void {
    const waiters = this.sessionWaiters.get(remotePubkey)
    if (!waiters) return
    this.sessionWaiters.delete(remotePubkey)
    for (const waiter of waiters) {
      clearTimeout(waiter.timer)
      waiter.resolve(session)
    }
  }
}
