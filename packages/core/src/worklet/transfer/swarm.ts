import b4a from 'b4a'
import crypto from 'hypercore-crypto'
import Hyperswarm, { type PeerInfo, type PeerSocket } from 'hyperswarm'
import { PeerControlChannel } from './control-channel'
import type { PeerControlMessage } from './control-channel'
import { PeerIdentityStore, type NoiseKeyPair } from './peer-identity-store'
import { PeerDrive } from './drive'
import {
  allRelaysBusy,
  relayConfigSummary,
  relayThrough,
  isOfficialRelayHost,
  isRelayHost,
  wantsRelay
} from '../relay/config'
import { attachRelayDial } from '../relay/announce'
import { whenOfficialRelaysKnown, whenRelayConfReady } from '../relay/conf'
import { ConnectProgress, watchDialOpen, type ConnectProgressState } from './connect-progress'
import { remoteHostOf } from './utils'

type ConnectionType = 'direct' | 'relay' | 'own-relay'

function connectionTypeOf(socket: PeerSocket): ConnectionType {
  const host = remoteHostOf(socket)
  if (isOfficialRelayHost(host)) return 'relay'
  if (isRelayHost(host)) return 'own-relay'
  return 'direct'
}

export interface PeerSession {
  socket: PeerSocket
  peerKey: string
  controlChannel: PeerControlChannel
  handshakeHash: Uint8Array | null
  drive: PeerDrive | null
}

export interface TransferSwarmCallbacks {
  onPeerConnected: (session: PeerSession) => void
  onPeerDisconnected: (peerKey: string | null, remainingCount: number) => void
  onControlMessage: (message: PeerControlMessage, session: PeerSession) => void
  onConnectionType?: (peerKey: string, connectionType: ConnectionType) => void
  onRelayBusy?: () => void
  onConnectProgress?: (progress: ConnectProgressState) => void
}

export interface TransferSwarmOptions {
  identityStore?: PeerIdentityStore
  drive?: boolean
}

function relayUsable(): boolean {
  const summary = relayConfigSummary()
  return summary.enabled && summary.keyCount > 0
}

export class TransferSwarm {
  private swarm: Hyperswarm | null
  private readonly peerSessions: Map<PeerSocket, PeerSession>
  private readonly callbacks: TransferSwarmCallbacks
  private readonly identityStore: PeerIdentityStore | null
  private readonly driveEnabled: boolean
  private hostedTopicHex: string | null
  private joinedAny: boolean
  private readonly progress: ConnectProgress

  constructor(callbacks: TransferSwarmCallbacks, options: TransferSwarmOptions = {}) {
    this.identityStore = options.identityStore ?? null
    this.driveEnabled = options.drive ?? false
    this.callbacks = callbacks
    this.peerSessions = new Map()
    this.hostedTopicHex = null
    this.joinedAny = false
    this.swarm = null
    this.progress = new ConnectProgress(
      (progress) => this.callbacks.onConnectProgress?.(progress),
      relayUsable
    )
  }

  private ensureSwarm(): Hyperswarm {
    if (!this.swarm) {
      this.swarm = this.createSwarm()
    }
    return this.swarm
  }

  private createSwarm(keyPair?: NoiseKeyPair): Hyperswarm {
    const swarm = new Hyperswarm({
      ...(keyPair ? { keyPair } : {}),
      relayThrough: (force: boolean, target: unknown) => this.selectRelays(force, target)
    })
    attachRelayDial(swarm.dht, {
      onAllRelaysBusy: () => this.callbacks.onRelayBusy?.(),
      onPeerDial: (socket) => watchDialOpen(socket, (err) => this.progress.failed(err)),
      onRelayDial: () => this.progress.relaying()
    })
    swarm.on('connection', (socket, info) => {
      this.handleConnection(socket, info).catch((err) => {
        console.error(
          'TransferSwarm: handleConnection failed',
          err instanceof Error ? err.message : String(err)
        )
        try {
          socket.destroy()
        } catch {}
      })
    })
    swarm.on('update', () => {
      if (swarm.connecting > 0) this.progress.attempting()
    })
    return swarm
  }

  private selectRelays(force: boolean, swarm: unknown): Uint8Array[] | null {
    const keys = relayThrough(force, swarm)
    if (keys === null && wantsRelay(force, swarm) && allRelaysBusy()) {
      this.callbacks.onRelayBusy?.()
    }
    return keys
  }

  private async handleConnection(socket: PeerSocket, info: PeerInfo): Promise<void> {
    const peerKey = b4a.toString(info.publicKey, 'hex')

    let session: PeerSession | null = null
    const controlChannel = PeerControlChannel.create(socket, (message) => {
      if (!session) return
      try {
        this.callbacks.onControlMessage(message, session)
      } catch (err) {
        console.error(
          'TransferSwarm: onControlMessage handler threw',
          err instanceof Error ? err.message : String(err)
        )
      }
    })
    if (!controlChannel) {
      try {
        socket.destroy()
      } catch {}
      return
    }

    session = {
      socket,
      peerKey,
      controlChannel,
      handshakeHash: socket.handshakeHash ?? null,
      drive: this.driveEnabled ? PeerDrive.create(socket) : null
    }
    this.peerSessions.set(socket, session)
    this.callbacks.onPeerConnected(session)
    this.classifyConnection(socket, peerKey)

    socket.on('close', () => this.cleanupPeer(socket))
    socket.on('error', () => this.cleanupPeer(socket))
  }

  private classifyConnection(socket: PeerSocket, peerKey: string): void {
    const report = this.callbacks.onConnectionType
    if (!report) return

    let current = connectionTypeOf(socket)
    let closed = false
    socket.on('close', () => {
      closed = true
    })
    report(peerKey, current)

    const reclassify = (): ConnectionType => {
      const next = connectionTypeOf(socket)
      if (next !== current) {
        current = next
        report(peerKey, next)
      }
      return next
    }

    const watchUntilDirect = () => {
      let ticks = 0
      const timer = setInterval(() => {
        if (reclassify() === 'direct' || ++ticks >= 8) clearInterval(timer)
      }, 2000)
      ;(timer as unknown as { unref?: () => void }).unref?.()
      socket.on('close', () => clearInterval(timer))
    }

    if (current !== 'direct') {
      watchUntilDirect()
      return
    }

    whenOfficialRelaysKnown()
      .then(() => {
        if (closed) return
        if (reclassify() !== 'direct') watchUntilDirect()
      })
      .catch((error: unknown) => {
        console.warn('[swarm] connection reclassify failed', error)
      })
  }

  private cleanupPeer(socket: PeerSocket): void {
    const session = this.peerSessions.get(socket)
    if (!session) return
    this.peerSessions.delete(socket)
    session.drive?.destroy()
    this.callbacks.onPeerDisconnected(session.peerKey, this.peerSessions.size)
  }

  private joinTopic(topic: Uint8Array): void {
    const discovery = crypto.discoveryKey(topic)
    this.joinedAny = true
    this.progress.reset()
    const swarm = this.ensureSwarm()
    swarm.join(discovery, { server: true, client: false })

    const enableDialing = () => {
      if (this.swarm !== swarm || !this.joinedAny) return
      swarm.join(discovery, { server: true, client: true })
    }

    whenRelayConfReady().then(enableDialing, (err: unknown) => {
      console.warn('TransferSwarm: relay conf wait failed', err)
      enableDialing()
    })
  }

  async suspendTransport(): Promise<void> {
    this.joinedAny = false
    this.progress.reset()

    for (const [conn, session] of this.peerSessions) {
      session.drive?.destroy()
      try {
        conn.destroy()
      } catch {}
    }
    this.peerSessions.clear()

    const oldSwarm = this.swarm
    this.swarm = null

    if (oldSwarm) {
      try {
        await oldSwarm.destroy()
      } catch (err) {
        console.warn('TransferSwarm: old swarm destroy failed', err)
      }
    }
  }

  async endSession(): Promise<void> {
    this.hostedTopicHex = null
    await this.suspendTransport()
  }

  async join(topicHex: string): Promise<void> {
    if (this.identityStore && !this.joinedAny) {
      await this.swapKeyPair(await this.identityStore.getOrCreate(topicHex))
    }
    const topic = b4a.from(topicHex, 'hex')
    this.joinTopic(topic)
  }

  private async swapKeyPair(keyPair: NoiseKeyPair): Promise<void> {
    const oldSwarm = this.swarm
    this.swarm = this.createSwarm(keyPair)
    if (oldSwarm) {
      try {
        await oldSwarm.destroy()
      } catch (err) {
        console.warn('TransferSwarm: keypair swap — old swarm destroy failed', err)
      }
    }
  }

  generateKey(): string {
    if (this.hostedTopicHex) {
      return this.hostedTopicHex
    }
    const topic = crypto.randomBytes(32)
    const topicHex = b4a.toString(topic, 'hex')
    this.joinTopic(topic)
    this.hostedTopicHex = topicHex
    return topicHex
  }

  broadcast(message: PeerControlMessage): void {
    for (const session of this.peerSessions.values()) {
      session.controlChannel.send(message)
    }
  }

  get sessions(): PeerSession[] {
    return Array.from(this.peerSessions.values())
  }

  getSession(peerKey: string): PeerSession | null {
    for (const session of this.peerSessions.values()) {
      if (session.peerKey === peerKey) return session
    }
    return null
  }

  sendTo(peerKey: string, message: PeerControlMessage): void {
    this.getSession(peerKey)?.controlChannel.send(message)
  }

  getHandshakeHash(peerKey: string): Uint8Array | null {
    return this.getSession(peerKey)?.handshakeHash ?? null
  }

  get peerCount(): number {
    return this.peerSessions.size
  }

  hasConnectedPeers(): boolean {
    return this.peerSessions.size > 0
  }

  async destroy(): Promise<void> {
    for (const conn of this.peerSessions.keys()) {
      try {
        conn.destroy()
      } catch {}
    }
    if (this.swarm) {
      await this.swarm.destroy()
    }
  }
}
