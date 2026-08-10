import crypto from 'hypercore-crypto'
import {
  createErrorEvent,
  createRoleEvent,
  createStatusEvent,
  TRANSFER_ERROR_CODES,
  type TransferErrorCode,
  type TransferIPCMessage,
  type TransferRole,
  type TransferStatus,
  type StatusEvent
} from '../rpc/events'
import { BadRequestError } from '../rpc/protocol'
import type {
  DisconnectReply,
  DownloadFileRequest,
  DownloadFilesReply,
  HostReply,
  InviteDeviceInput,
  InviteDeviceReply,
  InviteResponseInput,
  InviteResponseReply,
  InitDeviceSecretReply,
  JoinReply,
  RememberVoteInput,
  RememberVoteReply,
  RenamePeerInput,
  SetRelayConfigInput,
  SetRelayConfigReply,
  ShareFileRequest,
  ShareFilesReply,
  TransferRPC
} from '../rpc/protocol'
import {
  type DownloadComplete,
  type DownloadFailed,
  type DownloadProgress,
  type DownloadRequest,
  type PeerControlMessage,
  type TextOffer,
  type TransferOffer,
  type TransferReady,
  type TransferStart
} from './control-channel'
import { topicProof } from './topic-auth'
import {
  createDownloadCompleteMessage,
  createDownloadFailedMessage,
  createDownloadProgressMessage,
  createDownloadRequestMessage,
  createDownloadStartEvent,
  createDownloadStatusEvent,
  createPeerDownloadStatusEvent,
  getDownloadFailureMessage,
  type PeerDownloadStatus
} from './download-events'
import type { DownloadLifecycleEvent, DownloaderCallbacks } from './download-events'
import type { DriveChannel } from '@altersend/drive'
import type { PeerDrive } from './drive'
import { PeerIdentityStore } from './peer-identity-store'
import { TransferStorage } from './storage'
import { TransferSwarm, type PeerSession } from './swarm'
import { AbortError, isValidHexKey } from './utils'
import {
  DeviceIdentityStore,
  type DeviceIdentityDefaults,
  type DeviceSecretInit
} from '../identity/device-identity-store'
import { RememberedPeerStore } from '../peers/store'
import { MAX_DISPLAY_NAME_LEN, type RememberedPeer } from '../peers/remembered-peer'
import { RememberCoordinator } from '../peers/remember-coordinator'
import { RecognitionCoordinator } from '../peers/recognition-coordinator'
import { DiscoveryCoordinator } from '../peers/discovery'
import { PairingCoordinator } from '../peers/pairing-coordinator'
import { configureRelay, relayConfigSummary, setRelaySending } from '../relay/config'
import { upgradeWebRelay } from '../relay/upgradeWebRelay'

function createTransferId(): string {
  return crypto.randomBytes(16).toString('hex')
}

async function tryAsync(label: string, op: () => Promise<unknown>): Promise<void> {
  try {
    await op()
  } catch (err) {
    console.warn(`TransferOrchestrator: ${label} failed`, err)
  }
}

function tryAsyncWithin(label: string, ms: number, op: () => Promise<unknown>): Promise<void> {
  return new Promise<void>((resolve) => {
    const timer = setTimeout(() => {
      console.warn(`TransferOrchestrator: ${label} timed out after ${ms}ms`)
      resolve()
    }, ms)
    tryAsync(label, op).then(() => {
      clearTimeout(timer)
      resolve()
    })
  })
}

const AUTH_TIMEOUT_MS = 10000
const LIFECYCLE_TEARDOWN_TIMEOUT_MS = 5000

export class TransferOrchestrator implements TransferRPC {
  private readonly emitIPC: (message: TransferIPCMessage | PeerControlMessage) => void
  private readonly storage: TransferStorage
  private readonly offerPeers = new Map<string, string>()

  private readonly swarm: TransferSwarm

  private activeTransfer: TransferStart | null = null
  private activeTransferReady: TransferReady | null = null
  private readonly pendingNonce = new Map<string, string>()
  private readonly authedPeers = new Set<string>()
  private readonly authTimers = new Map<string, ReturnType<typeof setTimeout>>()
  private role: TransferRole | null = null
  private currentTopic: string | null = null
  private suspended: boolean = false
  private lifecycleQueue: Promise<unknown> = Promise.resolve()
  private readonly inflight = new Set<AbortController>()
  private stagingAbort: AbortController | null = null

  private readonly deviceIdentityStore: DeviceIdentityStore
  private readonly rememberedStore: RememberedPeerStore
  private readonly recognition: RecognitionCoordinator
  private readonly remember: RememberCoordinator
  private readonly discovery: DiscoveryCoordinator

  private readonly pairing: PairingCoordinator

  constructor(
    emitIPC: (message: TransferIPCMessage | PeerControlMessage) => void,
    storageRoot: string,
    identityRoot: string,
    identityDefaults: DeviceIdentityDefaults = {}
  ) {
    this.emitIPC = emitIPC
    this.storage = new TransferStorage(storageRoot)
    this.deviceIdentityStore = new DeviceIdentityStore(identityRoot, identityDefaults)
    this.rememberedStore = new RememberedPeerStore(identityRoot)
    const identityStore = new PeerIdentityStore(identityRoot)
    this.swarm = new TransferSwarm(
      {
        onReady: () => this.storage.ready(),
        onReplicate: (socket) => {
          if (this.suspended) return
          this.storage.replicate(socket)
        },
        onPeerConnected: (session) => {
          if (this.suspended) return
          this.onPeerConnected(session)
        },
        onPeerDisconnected: (peerKey, count) => {
          if (this.suspended) return
          this.onPeerDisconnected(peerKey, count)
        },
        onControlMessage: (message, session) => {
          if (this.suspended) return
          this.onControlMessage(message, session)
        },
        onConnectionType: (peerKey, connectionType) => {
          if (this.suspended) return
          this.sendStatus('connection-type', { peer: peerKey, connectionType })
        }
      },
      { identityStore, drive: true }
    )
    this.discovery = new DiscoveryCoordinator({
      deviceIdentityStore: this.deviceIdentityStore,
      rememberedStore: this.rememberedStore,
      emit: (event) => this.emitIPC(event)
    })

    this.recognition = new RecognitionCoordinator({
      deviceIdentityStore: this.deviceIdentityStore,
      rememberedStore: this.rememberedStore,
      sendTo: (peerKey, message) => this.swarm.sendTo(peerKey, message),
      getHandshakeHash: (peerKey) => this.swarm.getHandshakeHash(peerKey),
      emit: (event) => this.emitIPC(event)
    })

    this.remember = new RememberCoordinator({
      deviceIdentityStore: this.deviceIdentityStore,
      rememberedStore: this.rememberedStore,
      sendTo: (peerKey, message) => this.swarm.sendTo(peerKey, message),
      getHandshakeHash: (peerKey) => this.swarm.getHandshakeHash(peerKey),
      emit: (event) => {
        this.emitIPC(event)
        if (event.type === 'remember-confirmed') void this.discovery.refresh()
      }
    })

    this.pairing = new PairingCoordinator({
      identityStore,
      deviceIdentityStore: this.deviceIdentityStore,
      rememberedStore: this.rememberedStore,
      emit: (event) => this.emitIPC(event),
      onRememberConfirmed: () => void this.discovery.refresh()
    })

    this.discovery.start()
  }

  hostPairing(): Promise<HostReply> {
    return this.pairing.host()
  }

  joinPairing(topic: string): Promise<JoinReply> {
    return this.pairing.join(topic)
  }

  private onPeerConnected(session: PeerSession): void {
    this.sendStatus('peer-connected', { peer: session.peerKey, peers: this.swarm.peerCount })
    this.recognition.onPeerConnected(session.peerKey)
    if (this.role !== 'sender') return
    const nonce = crypto.randomBytes(32).toString('hex')
    this.pendingNonce.set(session.peerKey, nonce)
    session.controlChannel.send({ type: 'challenge', nonce })
    this.authTimers.set(
      session.peerKey,
      setTimeout(() => {
        this.authTimers.delete(session.peerKey)
        if (this.authedPeers.has(session.peerKey)) return
        this.sendStatus('peer-unauthenticated', { peer: session.peerKey })
      }, AUTH_TIMEOUT_MS)
    )
  }

  private clearAuthTimer(peerKey: string): void {
    const timer = this.authTimers.get(peerKey)
    if (timer) {
      clearTimeout(timer)
      this.authTimers.delete(peerKey)
    }
  }

  rememberVote(input: RememberVoteInput): Promise<RememberVoteReply> {
    return this.remember.vote(input)
  }

  peersList(): Promise<RememberedPeer[]> {
    return this.rememberedStore.list()
  }

  async forgetPeer(pubkey: string): Promise<void> {
    await this.rememberedStore.forget(pubkey)
    this.discovery.forget(pubkey)
  }

  renamePeer(input: RenamePeerInput): Promise<RememberedPeer | null> {
    if (!input || typeof input !== 'object') throw new BadRequestError('Missing rename input')
    if (!isValidHexKey(input.remoteDevicePubkey)) {
      throw new BadRequestError('Invalid remoteDevicePubkey')
    }
    if (typeof input.displayName !== 'string') throw new BadRequestError('Missing displayName')
    const displayName = input.displayName.trim()
    if (displayName.length === 0) throw new BadRequestError('Missing displayName')
    if (displayName.length > MAX_DISPLAY_NAME_LEN) {
      throw new BadRequestError('displayName is too long')
    }
    return this.rememberedStore.rename(input.remoteDevicePubkey, displayName)
  }

  async initDeviceSecret(init: DeviceSecretInit): Promise<InitDeviceSecretReply> {
    const secretKey = await this.deviceIdentityStore.provideSecret(init)
    return { secretKey }
  }

  inviteDevice(input: InviteDeviceInput): Promise<InviteDeviceReply> {
    return this.discovery.invite(
      input.remoteDevicePubkey,
      input.topic,
      input.fileCount,
      input.textCount,
      input.totalSize
    )
  }

  respondToInvite(input: InviteResponseInput): Promise<InviteResponseReply> {
    return this.discovery.respondToInvite(input.remoteDevicePubkey, input.topic, input.response)
  }

  private onPeerDisconnected(peerKey: string | null, remainingCount: number): void {
    if (peerKey) {
      this.pendingNonce.delete(peerKey)
      this.authedPeers.delete(peerKey)
      this.clearAuthTimer(peerKey)
      this.recognition.onPeerDisconnected(peerKey)
      this.remember.onPeerDisconnected(peerKey)
      this.sendStatus('peer-disconnected', { peer: peerKey, peers: remainingCount })
    }
    this.sendStatus(remainingCount > 0 ? 'peer-connected' : 'joined', { peers: remainingCount })
  }

  private onControlMessage(message: PeerControlMessage, session: PeerSession): void {
    if (message.type === 'hello') {
      this.sendStatus('peer-client', { peer: session.peerKey, client: message.client })
      return
    }
    if (message.type === 'challenge') {
      if (this.role === 'receiver' && this.currentTopic) {
        session.controlChannel.send({
          type: 'auth',
          proof: topicProof(this.currentTopic, message.nonce)
        })
      }
      return
    }
    if (message.type === 'auth') {
      this.verifyAuth(message.proof, session)
      return
    }
    if (message.type === 'web-relay') {
      if (!this.authedPeers.has(session.peerKey)) return

      upgradeWebRelay(message.cid, message.host).catch((err) => {
        console.warn('[pro] web relay upgrade rejected', err instanceof Error ? err.message : err)
      })
      return
    }
    if (message.type === 'recognition') {
      void this.recognition.handleRecognition(message, session.peerKey)
      return
    }
    if (message.type === 'pairing-info') {
      void this.remember.handlePairingInfo(message, session)
      return
    }
    if (message.type === 'remember-vote') {
      this.remember.handleRememberVote(message, session.peerKey)
      return
    }

    if (message.type === 'transfer-start' || message.type === 'transfer-ready') {
      if (this.role !== 'receiver') {
        console.warn(`TransferOrchestrator: dropping inbound ${message.type} in role=${this.role}`)
        return
      }
      if (message.type === 'transfer-ready') {
        this.offerPeers.set(message.transferId, session.peerKey)
      }
      this.emitIPC(
        message.type === 'transfer-ready' ? { ...message, peer: session.peerKey } : message
      )
      return
    }

    if (this.role !== 'sender') {
      console.warn(`TransferOrchestrator: dropping inbound ${message.type} in role=${this.role}`)
      return
    }

    switch (message.type) {
      case 'download-request':
        this.forwardPeerDownloadStatus('peer-download-started', message, session)
        this.serve(message, session)
        return
      case 'download-progress':
        this.forwardPeerDownloadStatus('peer-download-progress', message, session)
        return
      case 'download-complete':
        this.forwardPeerDownloadStatus('peer-downloaded', message, session)
        return
      case 'download-failed':
        this.forwardPeerDownloadStatus('peer-download-failed', message, session)
        return
      default:
        return
    }
  }

  private serve(message: DownloadRequest, session: PeerSession): void {
    if (!session.drive) return
    session.drive
      .serve(message.fileId, message.fileName, this.storage.sender.localPath(message.fileId))
      .catch((err) =>
        console.warn(
          'TransferOrchestrator: drive send stopped',
          message.fileName,
          err instanceof Error ? err.message : String(err)
        )
      )
  }

  private async driveChannelFor(file: DownloadFileRequest): Promise<DriveChannel | null> {
    const peerKey = this.offerPeers.get(file.transferId)
    const drive = peerKey ? this.swarm.getSession(peerKey)?.drive : null
    if (!drive || !(await this.speaksDrive(drive))) return null
    return drive.session(file.fileId)
  }

  private speaksDrive(drive: PeerDrive | null | undefined): Promise<boolean> {
    return drive ? drive.supported.catch(() => false) : Promise.resolve(false)
  }

  private setRole(role: TransferRole | null): void {
    if (this.role === role) return
    this.role = role
    setRelaySending(role === 'sender')
    this.emitIPC(createRoleEvent(role))
  }

  private forwardPeerDownloadStatus(
    state: PeerDownloadStatus,
    message: DownloadRequest | DownloadProgress | DownloadComplete | DownloadFailed,
    session: PeerSession
  ): void {
    this.sendStatus(state, createPeerDownloadStatusEvent(message, session))
  }

  private sendStatus(state: TransferStatus, extra: Partial<StatusEvent> = {}): void {
    this.emitIPC(createStatusEvent(state, extra))
  }

  private sendError(
    message: string,
    code: TransferErrorCode = TRANSFER_ERROR_CODES.transferFailed
  ): void {
    this.emitIPC(createErrorEvent(message, code))
  }

  private onDownloadStart(event: DownloadLifecycleEvent): void {
    this.sendStatus('downloading', createDownloadStartEvent(event))
    this.swarm.broadcast(createDownloadRequestMessage(event))
  }

  private onDownloadProgress(event: DownloadLifecycleEvent): void {
    this.sendStatus('download-progress', createDownloadStatusEvent(event))
    this.swarm.broadcast(createDownloadProgressMessage(event))
  }

  private onDownloadComplete(event: DownloadLifecycleEvent): void {
    this.sendStatus('downloaded', createDownloadStatusEvent(event))
    this.swarm.broadcast(createDownloadCompleteMessage(event))
  }

  private onDownloadError(event: DownloadLifecycleEvent): void {
    const message = getDownloadFailureMessage(event)

    this.sendStatus('download-failed', {
      ...createDownloadStatusEvent(event),
      message
    })
    this.swarm.broadcast(createDownloadFailedMessage({ ...event, message }))
    if (!event.resumable && !event.cancelled) {
      this.sendError(message, TRANSFER_ERROR_CODES.downloadFailed)
    }
  }

  private getDownloaderCallbacks(): DownloaderCallbacks {
    return {
      onFileStart: (event) => this.onDownloadStart(event),
      onFileProgress: (event) => this.onDownloadProgress(event),
      onFileComplete: (event) => this.onDownloadComplete(event),
      onFileError: (event) => this.onDownloadError(event)
    }
  }

  async host(): Promise<HostReply> {
    await this.storage.ready()
    const topic = this.swarm.generateKey()
    this.currentTopic = topic
    return { topic }
  }

  async join(topic: string): Promise<JoinReply> {
    if (typeof topic !== 'string' || topic.length === 0) {
      throw new BadRequestError('Missing topic')
    }
    if (!isValidHexKey(topic)) {
      throw new BadRequestError('Invalid topic format', TRANSFER_ERROR_CODES.invalidTopic)
    }
    if (this.role === 'sender') {
      throw new BadRequestError('Cannot join a session while sharing files')
    }
    if (this.currentTopic === topic) {
      await this.swarm.join(topic)
      this.sendStatus('joined', { peers: this.swarm.peerCount })
      return { state: 'joined' }
    }
    if (this.currentTopic) {
      throw new BadRequestError('Already in a session. Disconnect first.')
    }

    await this.storage.ready()
    this.setRole('receiver')
    this.sendStatus('joining')
    try {
      await this.swarm.join(topic)
    } catch (err) {
      this.setRole(null)
      this.sendStatus('disconnected')
      throw err
    }
    this.currentTopic = topic
    this.sendStatus('joined')
    return { state: 'joined' }
  }

  async shareFiles(requests: ShareFileRequest[]): Promise<ShareFilesReply> {
    if (!Array.isArray(requests) || requests.length === 0) {
      throw new BadRequestError('Missing items to share')
    }
    if (this.suspended) {
      throw new BadRequestError('Cannot share items while suspended')
    }

    if (this.role === 'receiver') {
      await this.disconnect()
    }

    await this.storage.ready()
    this.stagingAbort?.abort()
    this.stagingAbort = null
    await this.storage.sender.reset()

    try {
      const fileRequests = requests.filter((r) => r.kind !== 'text')
      const textRequests = requests.filter((r) => r.kind === 'text')

      const { files, totalBytes, errors } = await this.storage.sender.scanFiles(fileRequests)
      for (const error of errors) this.sendError(error)

      if (files.length === 0 && textRequests.length === 0) {
        this.sendError('No valid items were selected to share.')
        return { acceptedFiles: 0 }
      }

      this.setRole('sender')

      const transferId = createTransferId()
      this.activeTransfer = {
        type: 'transfer-start',
        transferId,
        totalFiles: files.length + textRequests.length,
        totalBytes
      }
      this.activeTransferReady = null
      this.swarm.broadcast(this.activeTransfer)
      this.sendStatus('sharing', { transferId })

      const offers: TransferOffer[] = this.storage.sender.buildOffers(files, transferId)

      for (const req of textRequests) {
        if (!req.content || req.content.trim() === '') continue
        const textOffer: TextOffer = {
          id: createTransferId(),
          transferId,
          kind: 'text',
          content: req.content
        }
        offers.push(textOffer)
      }

      this.activeTransferReady = { type: 'transfer-ready', transferId, files: offers }
      for (const session of this.swarm.sessions) this.offerTo(session)

      return { acceptedFiles: offers.length }
    } catch (err) {
      this.activeTransfer = null
      this.activeTransferReady = null
      this.setRole(null)
      throw err
    }
  }

  private verifyAuth(proof: string, session: PeerSession): void {
    if (this.role !== 'sender') return
    const nonce = this.pendingNonce.get(session.peerKey)
    if (!nonce || !this.currentTopic) return
    if (proof !== topicProof(this.currentTopic, nonce)) {
      console.warn('TransferOrchestrator: peer failed topic auth', session.peerKey)
      this.clearAuthTimer(session.peerKey)
      session.socket.destroy()
      return
    }

    this.pendingNonce.delete(session.peerKey)
    this.clearAuthTimer(session.peerKey)

    this.sendStatus('peer-authenticated', { peer: session.peerKey })
    this.releaseOffers(session)
  }

  private releaseOffers(session: PeerSession): void {
    if (this.authedPeers.has(session.peerKey)) return
    this.authedPeers.add(session.peerKey)
    if (this.activeTransfer) session.controlChannel.send(this.activeTransfer)
    this.offerTo(session)
  }

  private offerTo(session: PeerSession): void {
    if (!this.authedPeers.has(session.peerKey)) return
    const ready = this.activeTransferReady
    if (!ready) return

    this.stageForLegacyPeer(session)
      .then(() => {
        if (this.activeTransferReady !== ready) return
        session.controlChannel.send(ready)
      })
      .catch((err) => {
        if (err instanceof AbortError) return
        console.warn('TransferOrchestrator: staging for peer failed', err)
        this.sendError(err instanceof Error ? err.message : String(err))
      })
  }

  private async stageForLegacyPeer(session: PeerSession): Promise<void> {
    if (await this.speaksDrive(session.drive)) return

    const transferId = this.activeTransferReady?.transferId
    const controller = this.stagingAbort ?? new AbortController()
    this.stagingAbort = controller

    await this.storage.sender.stageForLegacyPeers(
      (file) =>
        this.sendStatus('sharing', { file: file.fileName, path: file.inputPath, transferId }),
      controller.signal
    )
  }

  async downloadFiles(files: DownloadFileRequest[]): Promise<DownloadFilesReply> {
    if (!Array.isArray(files) || files.length === 0) {
      throw new BadRequestError('Missing files to download')
    }
    if (this.suspended) {
      await this.resume()
    }

    const controller = new AbortController()
    this.inflight.add(controller)
    try {
      const results = await this.storage.receiver.downloadFiles(
        files,
        this.getDownloaderCallbacks(),
        controller.signal,
        (file) => this.driveChannelFor(file)
      )
      return { files: results }
    } finally {
      this.inflight.delete(controller)
    }
  }

  async pauseDownload(fileId: string): Promise<void> {
    if (typeof fileId !== 'string' || fileId.length === 0) {
      throw new BadRequestError('Missing fileId')
    }
    const active = this.storage.receiver.activeDownloadIds()
    if (!this.storage.receiver.pause(fileId)) {
      throw new BadRequestError(
        `pauseDownload: no active download for "${fileId}". Active: [${active.join(', ')}]`
      )
    }
  }

  abortInFlight(): void {
    for (const session of this.swarm.sessions) session.drive?.cancel()
    this.stagingAbort?.abort()
    this.stagingAbort = null

    for (const controller of this.inflight) controller.abort()
  }

  async disconnect(): Promise<DisconnectReply> {
    this.suspended = true
    this.abortInFlight()
    this.recognition.reset()
    this.remember.reset()
    try {
      this.activeTransfer = null
      this.activeTransferReady = null
      this.currentTopic = null
      this.offerPeers.clear()

      await this.swarm.endSession()
      await this.storage.sender.reset()
      await this.storage.receiver.reset()
      await this.storage.wipeAndReinit()

      this.setRole(null)
      this.sendStatus('disconnected')
      return { state: 'disconnected' }
    } finally {
      this.suspended = false
    }
  }

  async closePeers(): Promise<void> {
    this.abortInFlight()
    this.recognition.reset()
    this.remember.reset()
    this.currentTopic = null
    this.offerPeers.clear()
    await this.swarm.endSession()
    await this.storage.receiver.discardPartials()
  }

  async setRelayConfig(input: SetRelayConfigInput): Promise<SetRelayConfigReply> {
    configureRelay({ enabled: input.enabled, proToken: input.proToken })
    const { enabled, keyCount } = relayConfigSummary()
    return { enabled, keyCount }
  }

  private enqueueLifecycle(op: () => Promise<void>): Promise<void> {
    const next = this.lifecycleQueue.then(op, op)
    this.lifecycleQueue = next.catch(() => {})
    return next
  }

  suspend(): Promise<void> {
    return this.enqueueLifecycle(async () => {
      if (this.suspended) return

      this.suspended = true
      this.abortInFlight()
      this.recognition.reset()
      this.remember.reset()

      await tryAsyncWithin('discovery.stop (suspend)', LIFECYCLE_TEARDOWN_TIMEOUT_MS, () =>
        this.discovery.stop()
      )
      await tryAsyncWithin('swarm.endSession (suspend)', LIFECYCLE_TEARDOWN_TIMEOUT_MS, () =>
        this.swarm.endSession()
      )
    })
  }

  resume(): Promise<void> {
    return this.enqueueLifecycle(async () => {
      if (!this.suspended) return

      this.suspended = false
      this.discovery.start()

      if (!this.currentTopic) return

      try {
        await this.swarm.join(this.currentTopic)
      } catch (err) {
        console.warn('TransferOrchestrator: swarm.join (resume) failed', err)
        this.sendError(err instanceof Error ? err.message : String(err))
      }
    })
  }

  async destroy(): Promise<void> {
    this.abortInFlight()
    this.recognition.reset()
    this.remember.reset()
    this.activeTransfer = null
    this.activeTransferReady = null
    this.currentTopic = null
    this.setRole(null)

    await tryAsync('discovery.stop', () => this.discovery.stop())
    await tryAsync('swarm.endSession', () => this.swarm.endSession())
    await tryAsync('pairing.destroy', () => this.pairing.destroy())
    await tryAsync('swarm.destroy', () => this.swarm.destroy())
    await tryAsync('rememberedStore.close', () => this.rememberedStore.close())
    await tryAsync('storage.destroy', () => this.storage.destroy())
  }
}
