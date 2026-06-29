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
  type TransferReady,
  type TransferStart
} from './control-channel'
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
import { PeerIdentityStore } from './peer-identity-store'
import { TransferStorage } from './storage'
import { TransferSwarm, type PeerSession } from './swarm'
import { isValidHexKey } from './utils'
import {
  DeviceIdentityStore,
  type DeviceIdentityDefaults,
  type DeviceSecretInit
} from '../identity/device-identity-store'
import { RememberedPeerStore } from '../peers/store'
import type { RememberedPeer } from '../peers/remembered-peer'
import { RememberCoordinator } from '../peers/remember-coordinator'
import { RecognitionCoordinator } from '../peers/recognition-coordinator'
import { DiscoveryCoordinator } from '../peers/discovery'
import { PairingCoordinator } from '../peers/pairing-coordinator'

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

/**
 * TransferOrchestrator is the top-level orchestrator for the AlterSend P2P file transfer engine.
 *
 * It composes focused subsystems:
 *   - TransferSwarm   — Hyperswarm peer connectivity and control channels
 *   - TransferStorage — ephemeral Corestore/Hyperdrive plus the file sender/receiver
 *   - Discovery/Remember/Pairing coordinators — remembered devices and pairing
 *
 * TransferOrchestrator itself is responsible for:
 *   - Lifecycle (initialisation, destroy)
 *   - Active transfer state (replayed to peers that join mid-transfer)
 *   - IPC event emission to the renderer
 *   - The public command surface consumed by TransferWorkerRPCServer
 */
export class TransferOrchestrator implements TransferRPC {
  private readonly emitIPC: (message: TransferIPCMessage | PeerControlMessage) => void
  private readonly storage: TransferStorage

  private readonly swarm: TransferSwarm

  private activeTransfer: TransferStart | null = null
  private activeTransferReady: TransferReady | null = null
  private role: TransferRole | null = null
  private currentTopic: string | null = null
  private suspended: boolean = false
  private inflightAbort: AbortController | null = null

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
        }
      },
      { identityStore }
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
    if (this.activeTransfer) session.controlChannel.send(this.activeTransfer)
    if (this.activeTransferReady) session.controlChannel.send(this.activeTransferReady)
    this.recognition.onPeerConnected(session.peerKey)
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

  async initDeviceSecret(init: DeviceSecretInit): Promise<InitDeviceSecretReply> {
    const secretKey = await this.deviceIdentityStore.provideSecret(init)
    return { secretKey }
  }

  inviteDevice(input: InviteDeviceInput): Promise<InviteDeviceReply> {
    return this.discovery.invite(
      input.remoteDevicePubkey,
      input.topic,
      input.fileCount,
      input.totalSize
    )
  }

  respondToInvite(input: InviteResponseInput): Promise<InviteResponseReply> {
    return this.discovery.respondToInvite(input.remoteDevicePubkey, input.topic, input.response)
  }

  private onPeerDisconnected(peerKey: string | null, remainingCount: number): void {
    if (peerKey) {
      this.recognition.onPeerDisconnected(peerKey)
      this.remember.onPeerDisconnected(peerKey)
      this.sendStatus('peer-disconnected', { peer: peerKey, peers: remainingCount })
    }
    this.sendStatus(remainingCount > 0 ? 'peer-connected' : 'joined', { peers: remainingCount })
  }

  private onControlMessage(message: PeerControlMessage, session: PeerSession): void {
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
      this.emitIPC(message)
      return
    }

    if (this.role !== 'sender') {
      console.warn(`TransferOrchestrator: dropping inbound ${message.type} in role=${this.role}`)
      return
    }

    switch (message.type) {
      case 'download-request':
        this.forwardPeerDownloadStatus('peer-download-started', message, session)
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

  private setRole(role: TransferRole | null): void {
    if (this.role === role) return
    this.role = role
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
    this.sendError(message, TRANSFER_ERROR_CODES.downloadFailed)
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
      throw new BadRequestError('Missing files to share')
    }
    if (this.suspended) {
      throw new BadRequestError('Cannot share files while suspended')
    }

    if (this.role === 'receiver') {
      await this.disconnect()
    }

    await this.storage.ready()

    try {
      const { files, totalBytes, errors } = await this.storage.sender.scanFiles(requests)
      for (const error of errors) this.sendError(error)

      if (files.length === 0) {
        this.sendError('No valid files were selected to share. Folders are not supported yet.')
        return { acceptedFiles: 0 }
      }

      this.setRole('sender')

      const transferId = createTransferId()
      this.activeTransfer = {
        type: 'transfer-start',
        transferId,
        totalFiles: files.length,
        totalBytes
      }
      this.activeTransferReady = null
      this.swarm.broadcast(this.activeTransfer)

      const controller = new AbortController()
      this.inflightAbort = controller

      try {
        const offers = await this.storage.sender.stageFiles(
          files,
          transferId,
          (file) => {
            this.sendStatus('sharing', { file: file.fileName, path: file.inputPath, transferId })
          },
          controller.signal
        )

        this.activeTransferReady = { type: 'transfer-ready', transferId, files: offers }
        this.swarm.broadcast(this.activeTransferReady)

        return { acceptedFiles: offers.length }
      } catch (err) {
        this.activeTransfer = null
        this.activeTransferReady = null
        this.setRole(null)
        throw err
      } finally {
        this.inflightAbort = null
      }
    } finally {
      await this.storage.sender.closeSourceDrives()
    }
  }

  async downloadFiles(files: DownloadFileRequest[]): Promise<DownloadFilesReply> {
    if (!Array.isArray(files) || files.length === 0) {
      throw new BadRequestError('Missing files to download')
    }
    if (this.suspended) {
      throw new BadRequestError('Cannot download files while suspended')
    }

    const controller = new AbortController()
    this.inflightAbort = controller
    try {
      const results = await this.storage.receiver.downloadFiles(
        files,
        this.getDownloaderCallbacks(),
        controller.signal
      )
      return { files: results }
    } finally {
      this.inflightAbort = null
    }
  }

  abortInFlight(): void {
    const controller = this.inflightAbort
    if (!controller) return

    this.inflightAbort = null
    controller.abort()
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

      await this.swarm.endSession()
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
    await this.swarm.endSession()
  }

  async suspend(): Promise<void> {
    if (this.suspended) return

    this.suspended = true
    this.abortInFlight()
    this.recognition.reset()
    this.remember.reset()

    await tryAsync('discovery.stop (suspend)', () => this.discovery.stop())
    await tryAsync('swarm.endSession (suspend)', () => this.swarm.endSession())
  }

  async resume(): Promise<void> {
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
