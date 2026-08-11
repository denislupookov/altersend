import { dispatchToTransferStore } from './store'
import { getAppActive } from './effects/appActive'
import { getTransferDebugMessage, getTransferErrorCode } from './errors'
import { TRANSFER_ERROR_CODES } from './types'
import type { SharingStatusEvent } from '../send/draftModel'
import type { RendererTransferEvent, TransferRPC } from '@altersend/core'

export interface TransferApi {
  worker: TransferRPC
  startP2P: () => Promise<unknown>
  onTransferEvent: (cb: (message: RendererTransferEvent) => void) => () => void
}

export type ErrorHandler = (context: string, error: unknown) => void

export interface BindTransferApiOptions {
  onError?: ErrorHandler
}

let api: TransferApi | null = null
let errorHandler: ErrorHandler | null = null

export function getTransferApi(): TransferApi {
  if (!api) {
    throw new Error(
      'TransferApi not bound. Call bindTransferApi(api) at app entry before invoking commands.'
    )
  }
  return api
}

export async function loadPeers(): Promise<void> {
  try {
    const peers = await getTransferApi().worker.peersList()
    dispatchToTransferStore({ type: 'set_peers', peers })
  } catch (error) {
    reportError('loadPeers', error)
  }
}

export function reportError(context: string, error: unknown): void {
  if (errorHandler) {
    errorHandler(context, error)
  } else {
    console.error(`${context}:`, error)
  }
}

type StatusEvent = Extract<RendererTransferEvent, { type: 'status' }>

function dispatchRendererEvent(event: RendererTransferEvent): void {
  switch (event.type) {
    case 'status':
      return dispatchStatusEvent(event)
    case 'transfer-ready':
      return dispatchToTransferStore({
        type: 'transfer_ready',
        files: event.files,
        peer: event.peer
      })
    case 'role':
      if (event.role === null) discardPendingProgress()
      return dispatchToTransferStore({ type: 'role_changed', role: event.role })
    case 'error':
      return dispatchToTransferStore({
        type: 'set_error',
        code: event.code ?? TRANSFER_ERROR_CODES.transferFailed,
        message: event.message
      })
    case 'remember-confirmed':
      dispatchToTransferStore({
        type: 'remember_confirmed',
        peerKey: event.peerKey,
        displayName: event.peer.displayName
      })
      loadPeers()
      return
    case 'remember-declined':
      return dispatchToTransferStore({ type: 'remember_declined', peerKey: event.peerKey })
    case 'remember-requested':
      return dispatchToTransferStore({
        type: 'remember_requested',
        request: {
          transferId: event.transferId,
          peerKey: event.peerKey,
          displayName: event.displayName,
          deviceType: event.deviceType
        }
      })
    case 'invite-received':
      return dispatchToTransferStore({
        type: 'invite_received',
        invite: {
          remoteDevicePubkey: event.remoteDevicePubkey,
          displayName: event.displayName,
          deviceType: event.deviceType,
          topic: event.topic,
          ...(event.fileCount !== undefined ? { fileCount: event.fileCount } : {}),
          ...(event.textCount !== undefined ? { textCount: event.textCount } : {}),
          ...(event.totalSize !== undefined ? { totalSize: event.totalSize } : {})
        }
      })
    case 'invite-response-received':
      return dispatchToTransferStore({
        type: 'invite_response_received',
        response: {
          remoteDevicePubkey: event.remoteDevicePubkey,
          topic: event.topic,
          response: event.response,
          receivedAt: Date.now()
        }
      })
  }
}

const PROGRESS_FLUSH_MS = 100
const pendingProgress = new Map<string, () => void>()
let progressTimer: ReturnType<typeof setTimeout> | null = null
let lastFlushAt = 0

function stopProgressTimer(): void {
  if (!progressTimer) return
  clearTimeout(progressTimer)
  progressTimer = null
}

function queueProgress(key: string, dispatch: () => void): void {
  pendingProgress.set(key, dispatch)

  if (!getAppActive()) {
    const elapsed = Date.now() - lastFlushAt
    if (elapsed >= PROGRESS_FLUSH_MS || elapsed < 0) {
      flushProgress()
      return
    }
    if (!progressTimer) progressTimer = setTimeout(flushProgress, PROGRESS_FLUSH_MS - elapsed)
    return
  }

  if (progressTimer) return
  progressTimer = setTimeout(flushProgress, PROGRESS_FLUSH_MS)
}

function flushProgress(): void {
  stopProgressTimer()
  lastFlushAt = Date.now()
  const pending = Array.from(pendingProgress.values())
  pendingProgress.clear()
  for (const dispatch of pending) dispatch()
}

export function discardPendingProgress(): void {
  stopProgressTimer()
  lastFlushAt = 0
  pendingProgress.clear()
}

function dispatchStatusEvent(event: StatusEvent): void {
  switch (event.state) {
    case 'reconnecting':
      return dispatchToTransferStore({ type: 'reconnecting' })
    case 'sharing':
      return dispatchToTransferStore({
        type: 'apply_sharing_progress',
        event: event as SharingStatusEvent
      })
    case 'peer-download-progress':
      return queueProgress(`peer:${event.peer ?? ''}:${event.fileId ?? ''}`, () =>
        dispatchToTransferStore({ type: 'peer_download_event', event })
      )
    case 'peer-download-started':
    case 'peer-downloaded':
    case 'peer-download-failed':
      flushProgress()
      return dispatchToTransferStore({ type: 'peer_download_event', event })
    case 'download-progress':
      return queueProgress(`file:${event.fileId ?? ''}`, () =>
        dispatchToTransferStore({ type: 'receive_download_event', event })
      )
    case 'downloading':
    case 'downloaded':
    case 'download-failed':
      flushProgress()
      return dispatchToTransferStore({ type: 'receive_download_event', event })
    case 'peer-connected':
      dispatchToTransferStore({ type: 'status_changed', state: event.state, peers: event.peers })
      if (event.peer) dispatchToTransferStore({ type: 'peer_joined', peerKey: event.peer })
      return
    case 'peer-disconnected':
      if (event.peer) dispatchToTransferStore({ type: 'peer_left', peerKey: event.peer })
      return
    case 'connection-type':
      if (event.connectionType && event.peer) {
        dispatchToTransferStore({
          type: 'connection_type_changed',
          peer: event.peer,
          connectionType: event.connectionType
        })
      }
      return
    case 'peer-client':
      if (event.peer && event.client) {
        dispatchToTransferStore({
          type: 'peer_client_changed',
          peer: event.peer,
          client: event.client
        })
      }
      return
    case 'peer-unauthenticated':
      if (event.peer) dispatchToTransferStore({ type: 'peer_outdated', peer: event.peer })
      return
    case 'peer-authenticated':
      if (event.peer) dispatchToTransferStore({ type: 'peer_authenticated', peer: event.peer })
      return
    case 'joining':
    case 'joined':
    case 'disconnected':
      if (event.state === 'disconnected') discardPendingProgress()
      return dispatchToTransferStore({
        type: 'status_changed',
        state: event.state,
        peers: event.peers
      })
  }
}

let unbindCurrent: (() => void) | null = null
let bootSettled: Promise<void> = Promise.resolve()

export function whenTransferReady(): Promise<void> {
  return bootSettled
}

/**
 * Wires a platform `TransferApi` into the store: subscribes to worklet events,
 * kicks off `startP2P`, and dispatches lifecycle actions.
 */
export function bindTransferApi(
  impl: TransferApi,
  options: BindTransferApiOptions = {}
): () => void {
  if (api === impl) return unbindCurrent ?? (() => {})
  if (unbindCurrent) unbindCurrent()

  api = impl
  errorHandler = options.onError ?? null
  const off = impl.onTransferEvent(dispatchRendererEvent)

  bootSettled = impl
    .startP2P()
    .then(() => {
      dispatchToTransferStore({ type: 'booted' })
      loadPeers()
    })
    .catch((err) => {
      reportError('bindTransferApi.startP2P', err)
      dispatchToTransferStore({
        type: 'boot_failed',
        code: getTransferErrorCode(err, TRANSFER_ERROR_CODES.transferFailed),
        message: getTransferDebugMessage(err)
      })
    })

  unbindCurrent = () => {
    off()
    discardPendingProgress()
    api = null
    errorHandler = null
    unbindCurrent = null
  }

  return unbindCurrent
}
