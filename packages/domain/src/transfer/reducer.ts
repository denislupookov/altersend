import {
  applyDownloadMessage,
  applyDownloadRouted,
  createDownloadStateMap,
  resolveOfferKey
} from '../receive/downloadModel'
import { applySharingProgress, getPhaseFromSelection, mergeSelectedFiles } from '../send/draftModel'
import { applyPeerDownloadEvent } from '../send/shareModel'
import type { ConnectionState, TransferAction, TransferSessionState } from './types'

export const initialTransferSessionState: TransferSessionState = {
  topic: '',
  connectionState: 'disconnected',
  role: null,
  peerCount: 0,
  isReconnecting: false,
  incomingFileOffers: [],
  receiveDownloadStates: {},
  selectedFiles: [],
  draftPhase: 'empty',
  uploadItems: [],
  peerDownloads: {},
  connectedPeers: {},
  errorMessage: null
}

function mergeIncomingFileOffers(
  current: TransferSessionState['incomingFileOffers'],
  nextFiles: TransferSessionState['incomingFileOffers']
) {
  const existingKeys = new Set(current.map((offer) => `${offer.driveKey}:${offer.path}`))
  const uniqueNextFiles = nextFiles.filter(
    (offer) => !existingKeys.has(`${offer.driveKey}:${offer.path}`)
  )
  return uniqueNextFiles.length > 0 ? [...current, ...uniqueNextFiles] : current
}

function endSession(state: TransferSessionState): TransferSessionState {
  return {
    ...state,
    role: null,
    isReconnecting: false,
    incomingFileOffers: [],
    receiveDownloadStates: {},
    selectedFiles: [],
    draftPhase: 'empty',
    uploadItems: [],
    peerDownloads: {},
    connectedPeers: {},
    connectionState: 'disconnected',
    peerCount: 0,
    topic: '',
    errorMessage: null
  }
}

export function transferSessionReducer(
  state: TransferSessionState,
  action: TransferAction
): TransferSessionState {
  switch (action.type) {
    // ─── Lifecycle ────────────────────────────────────────────────
    case 'booted':
      return state.errorMessage === null ? state : { ...state, errorMessage: null }
    case 'boot_failed':
      return { ...state, errorMessage: action.message }

    // ─── Connection ───────────────────────────────────────────────
    case 'status_changed':
      switch (action.state) {
        case 'disconnected':
          return endSession(state)
        case 'joining':
          return { ...state, connectionState: 'joining', errorMessage: null }
        case 'joined': {
          const peerCount = typeof action.peers === 'number' ? action.peers : state.peerCount
          const resolved: ConnectionState = peerCount > 0 ? 'peer-connected' : 'joined'
          return { ...state, connectionState: resolved, peerCount, errorMessage: null }
        }
        case 'peer-connected': {
          const peerCount = action.peers ?? 1
          return {
            ...state,
            connectionState: 'peer-connected',
            peerCount,
            isReconnecting: false,
            errorMessage: null
          }
        }
      }
    case 'reconnecting':
      return { ...state, isReconnecting: true }
    case 'clear_session':
      return endSession(state)
    case 'join_failed':
      return {
        ...state,
        role: null,
        isReconnecting: false,
        connectionState: 'disconnected',
        peerCount: 0,
        receiveDownloadStates: {},
        uploadItems: [],
        peerDownloads: {},
        connectedPeers: {},
        errorMessage: action.message
      }

    // ─── Send flow ────────────────────────────────────────────────
    case 'share_requested':
      return { ...state, role: 'sender', peerDownloads: {}, connectedPeers: {}, errorMessage: null }
    case 'session_hosted':
      return { ...state, topic: action.topic }
    case 'add_selected_files': {
      if (action.files.length === 0) return state
      const next = mergeSelectedFiles(state.selectedFiles, action.files)
      return {
        ...state,
        selectedFiles: next,
        draftPhase: getPhaseFromSelection(next.length),
        uploadItems: []
      }
    }
    case 'remove_selected_file': {
      const next = state.selectedFiles.filter((f) => f.path !== action.path)
      if (next.length === state.selectedFiles.length) return state
      return { ...state, selectedFiles: next, draftPhase: getPhaseFromSelection(next.length) }
    }
    case 'set_draft_phase':
      return state.draftPhase === action.phase ? state : { ...state, draftPhase: action.phase }
    case 'clear_send_draft':
      return { ...state, selectedFiles: [], draftPhase: 'empty', uploadItems: [] }
    case 'init_upload_items':
      return { ...state, uploadItems: action.items }
    case 'complete_all_uploads':
      return {
        ...state,
        uploadItems: state.uploadItems.map((i) =>
          i.status === 'completed' ? i : { ...i, status: 'completed' }
        )
      }
    case 'reset_uploading_items':
      return {
        ...state,
        uploadItems: state.uploadItems.map((i) =>
          i.status === 'uploading' ? { ...i, status: 'waiting' } : i
        )
      }
    case 'apply_sharing_progress':
      if (state.role !== 'sender') return state
      return {
        ...state,
        uploadItems: applySharingProgress(state.uploadItems, action.event),
        errorMessage: null
      }
    case 'peer_download_event':
      if (state.role !== 'sender') return state
      return {
        ...state,
        peerDownloads: applyPeerDownloadEvent(state.peerDownloads, action.event)
      }
    case 'peer_joined': {
      if (state.role !== 'sender') return state
      return {
        ...state,
        connectedPeers: {
          ...state.connectedPeers,
          [action.peerKey]: { peerKey: action.peerKey, connectedAt: Date.now() }
        }
      }
    }
    case 'peer_left': {
      if (state.role !== 'sender') return state
      const existing = state.connectedPeers[action.peerKey]
      if (!existing || existing.disconnectedAt) return state
      return {
        ...state,
        connectedPeers: {
          ...state.connectedPeers,
          [action.peerKey]: { ...existing, disconnectedAt: Date.now() }
        }
      }
    }

    // ─── Receive flow ─────────────────────────────────────────────
    case 'join_requested':
      return {
        ...state,
        role: 'receiver',
        incomingFileOffers: [],
        receiveDownloadStates: {},
        selectedFiles: [],
        draftPhase: 'empty',
        uploadItems: [],
        peerDownloads: {},
        connectedPeers: {},
        connectionState: 'joining',
        peerCount: 0,
        errorMessage: null
      }
    case 'transfer_ready': {
      if (state.role !== 'receiver') return state
      const incomingFileOffers = mergeIncomingFileOffers(state.incomingFileOffers, action.files)
      return {
        ...state,
        incomingFileOffers,
        receiveDownloadStates: createDownloadStateMap(
          state.receiveDownloadStates,
          incomingFileOffers
        ),
        errorMessage: null
      }
    }
    case 'receive_download_event': {
      if (state.role !== 'receiver') return state
      const offerKey = resolveOfferKey(state.incomingFileOffers, action.event)
      if (!offerKey) return state
      const nextDownloadStates = applyDownloadMessage(
        state.receiveDownloadStates,
        offerKey,
        action.event
      )
      if (action.event.state === 'download-failed') {
        return {
          ...state,
          receiveDownloadStates: nextDownloadStates,
          errorMessage: action.event.message ?? state.errorMessage
        }
      }
      return { ...state, receiveDownloadStates: nextDownloadStates, errorMessage: null }
    }
    case 'download_routed':
      if (state.role !== 'receiver') return state
      return {
        ...state,
        receiveDownloadStates: applyDownloadRouted(state.receiveDownloadStates, action.offerKey, {
          destination: action.destination,
          intendedDestination: action.intendedDestination,
          savedTo: action.savedTo
        })
      }
    case 'peer_unreachable':
      if (state.incomingFileOffers.length > 0) {
        return { ...state, isReconnecting: false }
      }
      return {
        ...state,
        role: null,
        connectionState: 'disconnected',
        peerCount: 0,
        isReconnecting: false,
        topic: '',
        connectedPeers: {},
        errorMessage: "Couldn't reach the sender. Check the code and try again."
      }

    // ─── Misc ─────────────────────────────────────────────────────
    case 'role_changed':
      return {
        ...state,
        role: action.role,
        ...(action.role === null
          ? {
              incomingFileOffers: [],
              receiveDownloadStates: {},
              selectedFiles: [],
              draftPhase: 'empty' as const,
              uploadItems: [],
              peerDownloads: {},
              connectedPeers: {}
            }
          : {})
      }
    case 'set_error':
      return { ...state, errorMessage: action.message }

    default: {
      const exhaustiveCheck: never = action
      return exhaustiveCheck
    }
  }
}
