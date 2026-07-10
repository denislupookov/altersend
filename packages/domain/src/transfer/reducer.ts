import {
  applyDownloadMessage,
  applyDownloadRouted,
  createDownloadStateMap,
  resolveOfferKey
} from '../receive/downloadModel'
import { applySharingProgress, getPhaseFromSelection, mergeSelectedFiles } from '../send/draftModel'
import { applyPeerDownloadEvent } from '../send/shareModel'
import { TRANSFER_ERROR_CODES } from './types'
import type {
  ConnectionState,
  IncomingPairRequest,
  TransferAction,
  TransferConnectionType,
  TransferSessionState
} from './types'

function clearIncomingFor(
  incoming: IncomingPairRequest | null,
  peerKey: string
): IncomingPairRequest | null {
  return incoming?.peerKey === peerKey ? null : incoming
}

export { TRANSFER_ERROR_CODES } from './types'

export const initialTransferSessionState: TransferSessionState = {
  topic: '',
  connectionState: 'disconnected',
  connectionType: null,
  connectionTypes: {},
  transferPeerKey: null,
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
  errorCode: null,
  errorMessage: null,
  transferId: null,
  remember: {
    pairStatus: {},
    peerDisplayNames: {},
    incomingRequest: null,
    incomingInvite: null,
    inviteResponses: {}
  },
  peers: []
}

function deriveConnectionType(
  connectionTypes: Record<string, TransferConnectionType>,
  transferPeerKey: string | null
): TransferConnectionType | null {
  return transferPeerKey ? (connectionTypes[transferPeerKey] ?? null) : null
}

function clearError(state: TransferSessionState): TransferSessionState {
  return state.errorCode === null && state.errorMessage === null
    ? state
    : { ...state, errorCode: null, errorMessage: null }
}

function mergeIncomingFileOffers(
  current: TransferSessionState['incomingFileOffers'],
  nextFiles: TransferSessionState['incomingFileOffers']
) {
  const existingIds = new Set(current.map((offer) => offer.id))
  const uniqueNextFiles = nextFiles.filter((offer) => !existingIds.has(offer.id))
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
    connectionType: null,
    connectionTypes: {},
    transferPeerKey: null,
    peerCount: 0,
    topic: '',
    errorCode: null,
    errorMessage: null,
    transferId: null,
    remember: {
      pairStatus: {},
      peerDisplayNames: {},
      incomingRequest: null,
      incomingInvite: null,
      inviteResponses: {}
    }
  }
}

export function transferSessionReducer(
  state: TransferSessionState,
  action: TransferAction
): TransferSessionState {
  switch (action.type) {
    // ─── Lifecycle ────────────────────────────────────────────────
    case 'booted':
      return clearError(state)
    case 'boot_failed':
      return {
        ...state,
        errorCode: action.code ?? TRANSFER_ERROR_CODES.transferFailed,
        errorMessage: action.message
      }

    // ─── Connection ───────────────────────────────────────────────
    case 'status_changed':
      switch (action.state) {
        case 'disconnected':
          return endSession(state)
        case 'joining':
          return { ...state, connectionState: 'joining', errorCode: null, errorMessage: null }
        case 'joined': {
          const peerCount = typeof action.peers === 'number' ? action.peers : state.peerCount
          const resolved: ConnectionState = peerCount > 0 ? 'peer-connected' : 'joined'
          return {
            ...state,
            connectionState: resolved,
            peerCount,
            errorCode: null,
            errorMessage: null
          }
        }
        case 'peer-connected': {
          const peerCount = action.peers ?? 1
          return {
            ...state,
            connectionState: 'peer-connected',
            peerCount,
            isReconnecting: false,
            errorCode: null,
            errorMessage: null
          }
        }
      }
    case 'connection_type_changed': {
      if (state.connectionTypes[action.peer] === action.connectionType) return state
      const connectionTypes = { ...state.connectionTypes, [action.peer]: action.connectionType }
      return {
        ...state,
        connectionTypes,
        connectionType: deriveConnectionType(connectionTypes, state.transferPeerKey)
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
        errorCode: action.code ?? TRANSFER_ERROR_CODES.joinFailed,
        errorMessage: action.message
      }

    // ─── Send flow ────────────────────────────────────────────────
    case 'share_requested':
      return {
        ...state,
        role: 'sender',
        peerDownloads: {},
        connectedPeers: {},
        errorCode: null,
        errorMessage: null
      }
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
        transferId: action.event.transferId ?? state.transferId,
        errorCode: null,
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
        connectionType: null,
        connectionTypes: {},
        transferPeerKey: null,
        peerCount: 0,
        errorCode: null,
        errorMessage: null
      }
    case 'transfer_ready': {
      if (state.role !== 'receiver') return state
      const incomingFileOffers = mergeIncomingFileOffers(state.incomingFileOffers, action.files)
      const transferPeerKey = action.peer ?? state.transferPeerKey
      return {
        ...state,
        incomingFileOffers,
        receiveDownloadStates: createDownloadStateMap(
          state.receiveDownloadStates,
          incomingFileOffers
        ),
        transferPeerKey,
        connectionType: deriveConnectionType(state.connectionTypes, transferPeerKey),
        transferId: action.files[0]?.transferId ?? state.transferId,
        errorCode: null,
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
          errorCode: TRANSFER_ERROR_CODES.downloadFailed,
          errorMessage: action.event.message ?? state.errorMessage
        }
      }
      return {
        ...state,
        receiveDownloadStates: nextDownloadStates
      }
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
        errorCode: TRANSFER_ERROR_CODES.peerUnreachable,
        errorMessage: null
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
      return {
        ...state,
        errorCode: action.code ?? TRANSFER_ERROR_CODES.transferFailed,
        errorMessage: action.message
      }

    case 'remember_confirmed':
      return {
        ...state,
        remember: {
          ...state.remember,
          pairStatus: { ...state.remember.pairStatus, [action.peerKey]: 'paired' },
          peerDisplayNames: {
            ...state.remember.peerDisplayNames,
            [action.peerKey]: action.displayName
          },
          incomingRequest: clearIncomingFor(state.remember.incomingRequest, action.peerKey)
        }
      }
    case 'remember_declined': {
      const pairStatus = { ...state.remember.pairStatus }
      delete pairStatus[action.peerKey]
      const peerDisplayNames = { ...state.remember.peerDisplayNames }
      delete peerDisplayNames[action.peerKey]
      return {
        ...state,
        remember: {
          ...state.remember,
          pairStatus,
          peerDisplayNames,
          incomingRequest: clearIncomingFor(state.remember.incomingRequest, action.peerKey)
        }
      }
    }
    case 'remember_requested':
      return { ...state, remember: { ...state.remember, incomingRequest: action.request } }
    case 'set_peers':
      return { ...state, peers: action.peers }
    case 'forget_peer': {
      const key = action.peerKey.toLowerCase()
      const peers = state.peers.filter((peer) => peer.remoteDevicePubkey.toLowerCase() !== key)
      const pairStatus = { ...state.remember.pairStatus }
      delete pairStatus[action.peerKey]
      delete pairStatus[key]
      const peerDisplayNames = { ...state.remember.peerDisplayNames }
      delete peerDisplayNames[action.peerKey]
      delete peerDisplayNames[key]
      const inviteResponses = { ...state.remember.inviteResponses }
      delete inviteResponses[action.peerKey]
      delete inviteResponses[key]
      return {
        ...state,
        peers,
        remember: {
          ...state.remember,
          pairStatus,
          peerDisplayNames,
          inviteResponses,
          incomingRequest: clearIncomingFor(state.remember.incomingRequest, action.peerKey),
          incomingInvite:
            state.remember.incomingInvite?.remoteDevicePubkey.toLowerCase() === key
              ? null
              : state.remember.incomingInvite
        }
      }
    }
    case 'invite_received':
      return { ...state, remember: { ...state.remember, incomingInvite: action.invite } }
    case 'invite_response_received':
      return {
        ...state,
        remember: {
          ...state.remember,
          inviteResponses: {
            ...state.remember.inviteResponses,
            [action.response.remoteDevicePubkey]: action.response
          }
        }
      }
    case 'dismiss_invite':
      return { ...state, remember: { ...state.remember, incomingInvite: null } }
    case 'request_pair_peer':
      if (state.remember.pairStatus[action.peerKey] === 'paired') return state
      return {
        ...state,
        remember: {
          ...state.remember,
          pairStatus: { ...state.remember.pairStatus, [action.peerKey]: 'requested' }
        }
      }

    default: {
      const exhaustiveCheck: never = action
      return exhaustiveCheck
    }
  }
}
