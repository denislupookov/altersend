import b4a from 'b4a'
import crypto from 'hypercore-crypto'
import Hyperswarm, { type PeerInfo, type PeerSocket } from 'hyperswarm'
import { PeerControlChannel } from './control-channel'
import type { PeerControlMessage } from './control-channel'
import { PeerIdentityStore, type NoiseKeyPair } from './peer-identity-store'

export interface PeerSession {
  socket: PeerSocket
  peerKey: string
  controlChannel: PeerControlChannel
}

export interface TransferSwarmCallbacks {
  onReady: () => Promise<void>
  onReplicate: (socket: PeerSocket) => void
  onPeerConnected: (session: PeerSession) => void
  onPeerDisconnected: (peerKey: string | null, remainingCount: number) => void
  onControlMessage: (message: PeerControlMessage, session: PeerSession) => void
}

export interface TransferSwarmOptions {
  identityStore?: PeerIdentityStore
}

/**
 * TransferSwarm manages Hyperswarm connectivity.
 *
 * Responsibilities:
 *   - Joining / leaving discovery topics
 *   - Tracking active peer sessions
 *   - Creating per-socket Protomux control channels
 *   - Broadcasting control messages to all connected peers
 *
 */
export class TransferSwarm {
  private swarm: Hyperswarm | null
  private readonly peerSessions: Map<PeerSocket, PeerSession>
  private readonly callbacks: TransferSwarmCallbacks
  private readonly identityStore: PeerIdentityStore | null
  private hostedTopicHex: string | null
  private joinedAny: boolean

  constructor(callbacks: TransferSwarmCallbacks, options: TransferSwarmOptions = {}) {
    this.identityStore = options.identityStore ?? null
    this.callbacks = callbacks
    this.peerSessions = new Map()
    this.hostedTopicHex = null
    this.joinedAny = false
    this.swarm = null
  }

  private ensureSwarm(): Hyperswarm {
    if (!this.swarm) {
      this.swarm = this.createSwarm()
    }
    return this.swarm
  }

  private createSwarm(keyPair?: NoiseKeyPair): Hyperswarm {
    const swarm = keyPair ? new Hyperswarm({ keyPair }) : new Hyperswarm()
    swarm.on('connection', (socket, info) => {
      void this.handleConnection(socket, info).catch((err) => {
        console.error(
          'TransferSwarm: handleConnection failed',
          err instanceof Error ? err.message : String(err)
        )
        try {
          socket.destroy()
        } catch {}
      })
    })
    swarm.on('update', () => {})
    return swarm
  }

  private async handleConnection(socket: PeerSocket, info: PeerInfo): Promise<void> {
    const peerKey = b4a.toString(info.publicKey, 'hex')

    await this.callbacks.onReady()

    this.callbacks.onReplicate(socket)

    let session: PeerSession | null = null
    const controlChannel = PeerControlChannel.create(socket, (message) => {
      if (!session) return
      this.callbacks.onControlMessage(message, session)
    })
    if (!controlChannel) {
      try {
        socket.destroy()
      } catch {}
      return
    }

    session = { socket, peerKey, controlChannel }
    this.peerSessions.set(socket, session)
    this.callbacks.onPeerConnected(session)

    socket.on('close', () => this.cleanupPeer(socket))
    socket.on('error', () => this.cleanupPeer(socket))
  }

  private cleanupPeer(socket: PeerSocket): void {
    const session = this.peerSessions.get(socket)
    if (!session) return
    this.peerSessions.delete(socket)
    this.callbacks.onPeerDisconnected(session.peerKey, this.peerSessions.size)
  }

  private joinTopic(topic: Uint8Array): void {
    const discovery = crypto.discoveryKey(topic)
    this.joinedAny = true
    this.ensureSwarm().join(discovery, { server: true, client: true })
  }

  async endSession(): Promise<void> {
    this.hostedTopicHex = null
    this.joinedAny = false

    for (const conn of this.peerSessions.keys()) {
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
