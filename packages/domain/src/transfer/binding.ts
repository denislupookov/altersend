import { dispatchToTransferStore } from './store'
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
      return dispatchToTransferStore({ type: 'transfer_ready', files: event.files })
    case 'role':
      return dispatchToTransferStore({ type: 'role_changed', role: event.role })
    case 'error':
      return dispatchToTransferStore({
        type: 'set_error',
        code: event.code ?? TRANSFER_ERROR_CODES.transferFailed,
        message: event.message
      })
  }
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
    case 'peer-download-started':
    case 'peer-download-progress':
    case 'peer-downloaded':
    case 'peer-download-failed':
      return dispatchToTransferStore({ type: 'peer_download_event', event })
    case 'downloading':
    case 'download-progress':
    case 'downloaded':
    case 'download-failed':
      return dispatchToTransferStore({ type: 'receive_download_event', event })
    case 'peer-connected':
      dispatchToTransferStore({ type: 'status_changed', state: event.state, peers: event.peers })
      if (event.peer) dispatchToTransferStore({ type: 'peer_joined', peerKey: event.peer })
      return
    case 'peer-disconnected':
      if (event.peer) dispatchToTransferStore({ type: 'peer_left', peerKey: event.peer })
      return
    case 'joining':
    case 'joined':
    case 'disconnected':
      return dispatchToTransferStore({
        type: 'status_changed',
        state: event.state,
        peers: event.peers
      })
  }
}

let unbindCurrent: (() => void) | null = null

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

  void impl
    .startP2P()
    .then(() => dispatchToTransferStore({ type: 'booted' }))
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
    api = null
    errorHandler = null
    unbindCurrent = null
  }

  return unbindCurrent
}
