import crypto from 'hypercore-crypto'
import Corestore from 'corestore'
import fs from 'bare-fs'
import Hyperdrive from 'hyperdrive'
import {
  createErrorEvent,
  createRoleEvent,
  createStatusEvent,
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
  JoinReply,
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
import { TransferReceiver } from './receiver'
import type { DownloadLifecycleEvent, DownloaderCallbacks } from './download-events'
import { PeerIdentityStore } from './peer-identity-store'
import { TransferSender } from './sender'
import { TransferSwarm, type PeerSession } from './swarm'
import { isValidHexKey } from './utils'

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
 * It composes three focused subsystems:
 *   - TransferSwarm      — Hyperswarm peer connectivity and control channels
 *   - TransferSender     — Local file → Hyperdrive staging (sender path)
 *   - TransferReceiver — Remote Hyperdrive → disk writing (receiver path)
 *
 * TransferOrchestrator itself is responsible for:
 *   - Lifecycle (initialisation, destroy)
 *   - Active transfer state (replayed to peers that join mid-transfer)
 *   - IPC event emission to the renderer
 *   - The public command surface consumed by TransferWorkerRPCServer
 */
export class TransferOrchestrator implements TransferRPC {
  private readonly emitIPC: (message: TransferIPCMessage | PeerControlMessage) => void
  private readonly storageRoot: string
  private coreStore!: Corestore
  private outgoingStore!: Corestore
  private incomingStore!: Corestore
  private drive!: Hyperdrive
  private readyPromise!: Promise<void>

  private readonly swarm: TransferSwarm
  private stager!: TransferSender
  private downloader!: TransferReceiver

  private activeTransfer: TransferStart | null = null
  private activeTransferReady: TransferReady | null = null
  private role: TransferRole | null = null
  private currentTopic: string | null = null
  private suspended: boolean = false
  private inflightAbort: AbortController | null = null

  constructor(
    emitIPC: (message: TransferIPCMessage | PeerControlMessage) => void,
    storageRoot: string,
    identityRoot: string
  ) {
    this.emitIPC = emitIPC
    this.storageRoot = storageRoot
    this.initStorage()
    const identityStore = new PeerIdentityStore(identityRoot)
    this.swarm = new TransferSwarm(
      {
        onReady: () => this.readyPromise,
        onReplicate: (socket) => {
          if (this.suspended) return
          return this.coreStore.replicate(socket, { live: true })
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
  }

  private initStorage(): void {
    this.coreStore = new Corestore(this.storageRoot)
    this.outgoingStore = this.coreStore.namespace('outgoing-drive')
    this.incomingStore = this.coreStore.namespace('incoming-drives')
    this.drive = new Hyperdrive(this.outgoingStore)
    this.readyPromise = this.drive.ready()
    this.stager = new TransferSender(this.drive)
    this.downloader = new TransferReceiver(this.incomingStore)
  }

  private async wipeStorage(): Promise<void> {
    await tryAsync('drive.close (wipe)', () => this.drive.close())
    await tryAsync('coreStore.close (wipe)', () => this.coreStore.close())
    await tryAsync('storage rm', () =>
      fs.promises.rm(this.storageRoot, { recursive: true, force: true })
    )
  }

  private async wipeAndReinitStorage(): Promise<void> {
    await this.wipeStorage()
    this.initStorage()
  }

  private onPeerConnected(session: PeerSession): void {
    this.sendStatus('peer-connected', { peer: session.peerKey, peers: this.swarm.peerCount })

    if (this.activeTransfer) session.controlChannel.send(this.activeTransfer)
    if (this.activeTransferReady) session.controlChannel.send(this.activeTransferReady)
  }

  private onPeerDisconnected(peerKey: string | null, remainingCount: number): void {
    if (peerKey) {
      this.sendStatus('peer-disconnected', { peer: peerKey, peers: remainingCount })
    }
    this.sendStatus(remainingCount > 0 ? 'peer-connected' : 'joined', { peers: remainingCount })
  }

  private onControlMessage(message: PeerControlMessage, session: PeerSession): void {
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

  private sendError(message: string): void {
    this.emitIPC(createErrorEvent(message))
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
    this.sendError(message)
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
    await this.readyPromise
    const topic = this.swarm.generateKey()
    this.currentTopic = topic
    return { topic }
  }

  async join(topic: string): Promise<JoinReply> {
    if (typeof topic !== 'string' || topic.length === 0) {
      throw new BadRequestError('Missing topic')
    }
    if (!isValidHexKey(topic)) {
      throw new BadRequestError('Invalid topic format')
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

    await this.readyPromise
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

    await this.readyPromise

    try {
      const { files, totalBytes, errors } = await this.stager.scanFiles(requests)
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
        const offers = await this.stager.stageFiles(
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
      await this.stager.closeSourceDrives()
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
      const results = await this.downloader.downloadFiles(
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
    try {
      this.activeTransfer = null
      this.activeTransferReady = null
      this.currentTopic = null
      await this.swarm.endSession()
      await this.downloader.reset()
      await this.wipeAndReinitStorage()
      this.setRole(null)
      this.sendStatus('disconnected')
      return { state: 'disconnected' }
    } finally {
      this.suspended = false
    }
  }

  /** Tears down the swarm but keeps role/drive/state. Use `disconnect()` for full cleanup. */
  async closePeers(): Promise<void> {
    this.abortInFlight()
    this.currentTopic = null
    await this.swarm.endSession()
  }

  async suspend(): Promise<void> {
    if (this.suspended) return
    this.suspended = true
    this.abortInFlight()
    await tryAsync('swarm.endSession (suspend)', () => this.swarm.endSession())
  }

  async resume(): Promise<void> {
    if (!this.suspended) return
    this.suspended = false
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
    this.activeTransfer = null
    this.activeTransferReady = null
    this.currentTopic = null
    this.setRole(null)

    await tryAsync('swarm.endSession', () => this.swarm.endSession())
    await tryAsync('downloader.destroy', () => this.downloader.destroy())
    await tryAsync('swarm.destroy', () => this.swarm.destroy())
    await tryAsync('drive.close', () => this.drive.close())
    await tryAsync('coreStore.close', () => this.coreStore.close())
    await tryAsync('storage rm (destroy)', () =>
      fs.promises.rm(this.storageRoot, { recursive: true, force: true })
    )
  }
}
