import { afterEach, describe, expect, it, vi } from 'vitest'
import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import b4a from 'b4a'
import crypto from 'hypercore-crypto'
import SecretStream from '@hyperswarm/secret-stream'
import { Duplex } from 'streamx'
import type { PeerSocket } from 'hyperswarm'
import { PeerControlChannel, type PeerControlMessage } from './control-channel'
import type { PeerSession, TransferSwarmCallbacks } from './swarm'
import { TransferOrchestrator } from './orchestrator'
import { legacyTopicProof } from './topic-auth'

interface FakeSwarm {
  callbacks: TransferSwarmCallbacks
  add: (session: PeerSession) => void
  remove: (session: PeerSession) => void
}

const { swarms } = vi.hoisted(() => ({ swarms: [] as FakeSwarm[] }))

vi.mock('./swarm', () => ({
  TransferSwarm: vi.fn(function (callbacks: TransferSwarmCallbacks) {
    const sessions = new Map<string, PeerSession>()
    const fake = {
      callbacks,
      add: (session: PeerSession) => sessions.set(session.peerKey, session),
      remove: (session: PeerSession) => sessions.delete(session.peerKey),
      get sessions() {
        return [...sessions.values()]
      },
      get peerCount() {
        return sessions.size
      },
      generateKey: () => b4a.toString(crypto.randomBytes(32), 'hex'),
      join: async () => {},
      getSession: (peerKey: string) => sessions.get(peerKey) ?? null,
      sendTo: (peerKey: string, message: PeerControlMessage) =>
        sessions.get(peerKey)?.controlChannel.send(message),
      broadcast: (message: PeerControlMessage) => {
        for (const session of sessions.values()) session.controlChannel.send(message)
      },
      getHandshakeHash: (peerKey: string) => sessions.get(peerKey)?.handshakeHash ?? null,
      endSession: async () => {},
      suspendTransport: async () => {},
      destroy: async () => {}
    }
    swarms.push(fake)
    return fake
  })
}))

vi.mock('../peers/discovery', () => ({
  DiscoveryCoordinator: vi.fn(function () {
    return {
      start: async () => {},
      stop: async () => {},
      refresh: async () => {},
      cancelWaiters: () => {},
      forget: () => {}
    }
  })
}))

type KeyPair = { publicKey: Uint8Array; secretKey: Uint8Array }

interface Party {
  orchestrator: TransferOrchestrator
  swarm: FakeSwarm
  keyPair: KeyPair
  events: unknown[]
}

const roots: string[] = []

afterEach(async () => {
  swarms.length = 0
  await Promise.all(roots.splice(0).map((root) => rm(root, { recursive: true, force: true })))
})

async function createParty(): Promise<Party> {
  const root = await mkdtemp(join(tmpdir(), 'altersend-auth-'))
  roots.push(root)
  const events: unknown[] = []
  const swarmIndex = swarms.length
  const orchestrator = new TransferOrchestrator((event) => events.push(event), root)
  return { orchestrator, swarm: swarms[swarmIndex], keyPair: crypto.keyPair(), events }
}

async function link(initiator: KeyPair, responder: KeyPair): Promise<[SecretStream, SecretStream]> {
  const a: Duplex = new Duplex({
    write(data: Uint8Array, cb: () => void) {
      b.push(data)
      cb()
    }
  })
  const b: Duplex = new Duplex({
    write(data: Uint8Array, cb: () => void) {
      a.push(data)
      cb()
    }
  })
  const left = new SecretStream(true, a, { keyPair: initiator })
  const right = new SecretStream(false, b, { keyPair: responder })
  await Promise.all([left.opened, right.opened])
  return [left, right]
}

function attach(party: Party, socket: SecretStream): void {
  const peerKey = b4a.toString(socket.remotePublicKey, 'hex')
  let session: PeerSession | null = null
  const controlChannel = PeerControlChannel.create(socket as unknown as PeerSocket, (message) => {
    if (session) party.swarm.callbacks.onControlMessage(message, session)
  })
  if (!controlChannel) throw new Error('control channel failed to open')
  session = {
    socket: socket as unknown as PeerSocket,
    peerKey,
    controlChannel,
    handshakeHash: socket.handshakeHash,
    drive: null
  }
  const attached = session
  party.swarm.add(attached)
  party.swarm.callbacks.onPeerConnected(attached)
  socket.on('close', () => {
    party.swarm.remove(attached)
    party.swarm.callbacks.onPeerDisconnected(peerKey, 0)
  })
}

async function connect(a: Party, b: Party): Promise<void> {
  const [left, right] = await link(a.keyPair, b.keyPair)
  attach(a, left)
  attach(b, right)
}

function hex(key: Uint8Array): string {
  return b4a.toString(key, 'hex')
}

const settle = () => new Promise((resolve) => setTimeout(resolve, 200))

async function startSession(): Promise<{ sender: Party; receiver: Party }> {
  const sender = await createParty()
  const receiver = await createParty()
  const { topic } = await sender.orchestrator.host()
  await sender.orchestrator.shareFiles([{ path: '', kind: 'text', content: 'secret note' }])
  await receiver.orchestrator.join(topic)
  return { sender, receiver }
}

function transferReadyFrom(party: Party, peer: KeyPair): unknown {
  return party.events.find(
    (e) =>
      (e as { type?: string; peer?: string }).type === 'transfer-ready' &&
      (e as { peer?: string }).peer === hex(peer.publicKey)
  )
}

describe('TransferOrchestrator topic auth', () => {
  it('delivers offers between a sender and receiver that both hold the code', async () => {
    const { sender, receiver } = await startSession()
    await connect(receiver, sender)

    await vi.waitFor(() => expect(transferReadyFrom(receiver, sender.keyPair)).toBeTruthy())
  })

  it('still releases offers to an old receiver that answers with the legacy proof', async () => {
    const sender = await createParty()
    const { topic } = await sender.orchestrator.host()
    await sender.orchestrator.shareFiles([{ path: '', kind: 'text', content: 'secret note' }])
    const [socket, senderSide] = await link(crypto.keyPair(), sender.keyPair)

    const received: PeerControlMessage[] = []
    let channel: PeerControlChannel | null = null
    channel = PeerControlChannel.create(socket as unknown as PeerSocket, (message) => {
      received.push(message)
      if (message.type === 'challenge') {
        channel?.send({ type: 'auth', proof: legacyTopicProof(topic, message.nonce) })
      }
    })
    attach(sender, senderSide)

    await vi.waitFor(() => expect(received.some((m) => m.type === 'transfer-ready')).toBe(true))
  })

  it.each([
    ['as-is', (message: PeerControlMessage) => message],
    [
      'with the auth version stripped',
      (message: PeerControlMessage) => ({ ...message, authVersion: undefined })
    ]
  ])('does not let a discovery-key-only peer relay proofs %s', async (_, rewrite) => {
    const { sender, receiver } = await startSession()
    const attacker = crypto.keyPair()
    const [toSenderSocket, senderSide] = await link(attacker, sender.keyPair)
    const [toReceiverSocket, receiverSide] = await link(attacker, receiver.keyPair)

    const fromSender: PeerControlMessage[] = []
    let toSender: PeerControlChannel | null = null
    let toReceiver: PeerControlChannel | null = null
    const relay = (message: PeerControlMessage, target: PeerControlChannel | null) => {
      if (message.type === 'challenge' || message.type === 'auth') target?.send(rewrite(message))
    }
    toSender = PeerControlChannel.create(toSenderSocket as unknown as PeerSocket, (message) => {
      fromSender.push(message)
      relay(message, toReceiver)
    })
    toReceiver = PeerControlChannel.create(toReceiverSocket as unknown as PeerSocket, (message) =>
      relay(message, toSender)
    )
    attach(sender, senderSide)
    attach(receiver, receiverSide)
    await settle()

    expect(fromSender.some((m) => m.type === 'transfer-ready')).toBe(false)
    expect(fromSender.some((m) => m.type === 'transfer-start')).toBe(false)
    expect(transferReadyFrom(receiver, attacker)).toBeUndefined()
  })

  it('ignores offers and session-end from a peer that never proved the code', async () => {
    const { receiver } = await startSession()
    const attacker = crypto.keyPair()
    const [socket, receiverSide] = await link(attacker, receiver.keyPair)
    const channel = PeerControlChannel.create(socket as unknown as PeerSocket, () => {})
    attach(receiver, receiverSide)

    channel?.send({
      type: 'transfer-ready',
      transferId: 'f'.repeat(32),
      files: [{ id: 'x', transferId: 'f'.repeat(32), kind: 'text', content: 'injected' }]
    })
    channel?.send({ type: 'session-end' })
    await settle()

    expect(transferReadyFrom(receiver, attacker)).toBeUndefined()
    expect(
      receiver.events.some((e) => (e as { state?: string }).state === 'peer-session-ended')
    ).toBe(false)
  })
})
