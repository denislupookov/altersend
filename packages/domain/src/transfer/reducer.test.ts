import { describe, expect, it } from 'vitest'
import {
  TRANSFER_ERROR_CODES,
  initialTransferSessionState,
  transferSessionReducer
} from './reducer'
import type { TransferAction, TransferSessionState } from './types'
import type { IncomingFileOffer, RememberedPeer } from '@altersend/core'

const make = (overrides: Partial<TransferSessionState> = {}): TransferSessionState => ({
  ...initialTransferSessionState,
  ...overrides
})

const offer = (id: string, name: string): IncomingFileOffer => ({
  id,
  transferId: 'tx-1',
  name,
  path: `/files/${name}`,
  size: 1024,
  driveKey: 'drive-1'
})

const apply = (state: TransferSessionState, action: TransferAction) =>
  transferSessionReducer(state, action)

const rememberedPeer = (remoteDevicePubkey: string): RememberedPeer => ({
  remoteDevicePubkey,
  rendezvousTopic: 'c'.repeat(64),
  displayName: 'My Laptop',
  deviceType: 'laptop',
  isMine: false,
  autoAccept: false,
  blocked: false,
  pairedAt: 1,
  lastSeenAt: 2
})

describe('transferSessionReducer — lifecycle', () => {
  it('returns the input state reference when booted has no error to clear', () => {
    const state = make()
    expect(apply(state, { type: 'booted' })).toBe(state)
  })

  it('clears errorMessage on booted when one is present', () => {
    const state = make({ errorCode: TRANSFER_ERROR_CODES.transferFailed, errorMessage: 'old' })
    const next = apply(state, { type: 'booted' })
    expect(next.errorCode).toBeNull()
    expect(next.errorMessage).toBeNull()
  })

  it('sets a typed error on boot_failed', () => {
    const next = apply(make(), { type: 'boot_failed', message: 'boom' })
    expect(next.errorCode).toBe(TRANSFER_ERROR_CODES.transferFailed)
    expect(next.errorMessage).toBe('boom')
  })
})

describe('transferSessionReducer — connection', () => {
  it('status_changed: joining updates connectionState', () => {
    const next = apply(make(), { type: 'status_changed', state: 'joining' })
    expect(next.connectionState).toBe('joining')
    expect(next.errorMessage).toBeNull()
  })

  it('status_changed: joined with peers > 0 resolves to peer-connected', () => {
    const next = apply(make(), { type: 'status_changed', state: 'joined', peers: 2 })
    expect(next.connectionState).toBe('peer-connected')
    expect(next.peerCount).toBe(2)
  })

  it('status_changed: joined with no peers stays as joined', () => {
    const next = apply(make(), { type: 'status_changed', state: 'joined', peers: 0 })
    expect(next.connectionState).toBe('joined')
  })

  it('status_changed: peer-connected clears isReconnecting', () => {
    const next = apply(make({ isReconnecting: true }), {
      type: 'status_changed',
      state: 'peer-connected',
      peers: 1
    })
    expect(next.isReconnecting).toBe(false)
    expect(next.peerCount).toBe(1)
  })

  it('status_changed: disconnected ends the session entirely', () => {
    const state = make({
      role: 'receiver',
      connectionState: 'peer-connected',
      peerCount: 1,
      incomingFileOffers: [offer('a', 'a.txt')]
    })
    const next = apply(state, { type: 'status_changed', state: 'disconnected' })
    expect(next.role).toBeNull()
    expect(next.connectionState).toBe('disconnected')
    expect(next.peerCount).toBe(0)
    expect(next.incomingFileOffers).toEqual([])
  })

  it('clear_session resets every field', () => {
    const state = make({
      role: 'sender',
      topic: 'abc',
      connectionState: 'peer-connected',
      peerCount: 1,
      selectedFiles: [{ name: 'a', path: '/a', size: 1 }]
    })
    const next = apply(state, { type: 'clear_session' })
    expect(next).toMatchObject({
      role: null,
      topic: '',
      connectionState: 'disconnected',
      peerCount: 0,
      selectedFiles: []
    })
  })

  it('reconnecting flips isReconnecting to true', () => {
    expect(apply(make(), { type: 'reconnecting' }).isReconnecting).toBe(true)
  })

  it('join_failed clears the session and stores a typed error', () => {
    const next = apply(make({ role: 'receiver', connectionState: 'joining' }), {
      type: 'join_failed',
      message: 'no host'
    })
    expect(next.role).toBeNull()
    expect(next.connectionState).toBe('disconnected')
    expect(next.errorCode).toBe(TRANSFER_ERROR_CODES.joinFailed)
    expect(next.errorMessage).toBe('no host')
  })
})

describe('transferSessionReducer — peer_unreachable', () => {
  it('clears isReconnecting only when there are pending offers (mid-transfer)', () => {
    const state = make({
      role: 'receiver',
      connectionState: 'peer-connected',
      peerCount: 1,
      isReconnecting: true,
      incomingFileOffers: [offer('a', 'a.txt')]
    })
    const next = apply(state, { type: 'peer_unreachable' })
    expect(next.isReconnecting).toBe(false)
    expect(next.role).toBe('receiver')
    expect(next.incomingFileOffers).toHaveLength(1)
  })

  it('tears down with an error when there are no pending offers (initial connect)', () => {
    const state = make({ role: 'receiver', connectionState: 'joining', topic: 'abc' })
    const next = apply(state, { type: 'peer_unreachable' })
    expect(next.role).toBeNull()
    expect(next.connectionState).toBe('disconnected')
    expect(next.topic).toBe('')
    expect(next.errorCode).toBe(TRANSFER_ERROR_CODES.peerUnreachable)
    expect(next.errorMessage).toBeNull()
  })
})

describe('transferSessionReducer — send flow', () => {
  it('share_requested switches role to sender', () => {
    const next = apply(make(), { type: 'share_requested' })
    expect(next.role).toBe('sender')
    expect(next.peerDownloads).toEqual({})
  })

  it('add_selected_files merges and updates draftPhase', () => {
    const file = { name: 'a.txt', path: '/a', size: 1 }
    const next = apply(make(), { type: 'add_selected_files', files: [file] })
    expect(next.selectedFiles).toEqual([file])
    expect(next.draftPhase).toBe('selected')
  })

  it('add_selected_files with empty input returns the same state reference', () => {
    const state = make()
    expect(apply(state, { type: 'add_selected_files', files: [] })).toBe(state)
  })

  it('remove_selected_file filters and resets draftPhase to empty when last file goes', () => {
    const state = make({
      selectedFiles: [{ name: 'a', path: '/a', size: 1 }],
      draftPhase: 'selected'
    })
    const next = apply(state, { type: 'remove_selected_file', path: '/a' })
    expect(next.selectedFiles).toEqual([])
    expect(next.draftPhase).toBe('empty')
  })
})

describe('transferSessionReducer — receive flow', () => {
  it('join_requested resets receiver state and enters joining', () => {
    const next = apply(make(), { type: 'join_requested' })
    expect(next.role).toBe('receiver')
    expect(next.connectionState).toBe('joining')
    expect(next.peerCount).toBe(0)
    expect(next.incomingFileOffers).toEqual([])
  })

  it('transfer_ready populates offers when role is receiver', () => {
    const state = make({ role: 'receiver' })
    const files = [offer('a', 'a.txt'), offer('b', 'b.txt')]
    const next = apply(state, { type: 'transfer_ready', files })
    expect(next.incomingFileOffers).toHaveLength(2)
    expect(Object.keys(next.receiveDownloadStates)).toHaveLength(2)
  })

  it('transfer_ready is a no-op when role is not receiver', () => {
    const state = make({ role: 'sender' })
    const next = apply(state, { type: 'transfer_ready', files: [offer('a', 'a.txt')] })
    expect(next).toBe(state)
  })

  it('receive_download_event is a no-op when role is not receiver', () => {
    const state = make({ role: 'sender', incomingFileOffers: [offer('a', 'a.txt')] })
    const next = apply(state, {
      type: 'receive_download_event',
      event: {
        type: 'status',
        state: 'downloading',
        transferId: 'tx-1',
        fileId: 'a',
        file: 'a.txt',
        path: '/files/a.txt',
        totalBytes: 1024,
        bytesTransferred: 0
      }
    })
    expect(next).toBe(state)
  })

  it('receive_download_event preserves an existing transfer error on non-failed updates', () => {
    const state = apply(make({ role: 'receiver' }), {
      type: 'transfer_ready',
      files: [offer('a', 'a.txt')]
    })
    const failed = apply(state, {
      type: 'receive_download_event',
      event: {
        type: 'status',
        state: 'download-failed',
        transferId: 'tx-1',
        fileId: 'a',
        file: 'a.txt',
        path: '/files/a.txt',
        message: 'disk full'
      }
    })
    const next = apply(failed, {
      type: 'receive_download_event',
      event: {
        type: 'status',
        state: 'downloading',
        transferId: 'tx-1',
        fileId: 'a',
        file: 'a.txt',
        path: '/files/a.txt',
        totalBytes: 1024,
        bytesTransferred: 512
      }
    })

    expect(next.errorCode).toBe(TRANSFER_ERROR_CODES.downloadFailed)
    expect(next.errorMessage).toBe('disk full')
  })

  it('download_routed is a no-op when role is not receiver', () => {
    const state = make({ role: 'sender' })
    const next = apply(state, {
      type: 'download_routed',
      offerKey: 'drive-1:/files/a.txt',
      destination: 'filesystem',
      intendedDestination: 'filesystem',
      savedTo: '/Downloads/a.txt'
    })
    expect(next).toBe(state)
  })
})

describe('transferSessionReducer — sender guards', () => {
  it('apply_sharing_progress is a no-op when role is not sender', () => {
    const state = make({ role: 'receiver' })
    const next = apply(state, {
      type: 'apply_sharing_progress',
      event: {
        type: 'status',
        state: 'sharing',
        file: 'a.txt',
        path: '/a.txt',
        transferId: 'tx-1'
      }
    })
    expect(next).toBe(state)
  })

  it('peer_download_event is a no-op when role is not sender', () => {
    const state = make({ role: 'receiver' })
    const next = apply(state, {
      type: 'peer_download_event',
      event: {
        type: 'status',
        state: 'peer-download-started',
        peer: 'peer-key-hex',
        transferId: 'tx-1',
        fileId: 'a',
        file: 'a.txt',
        path: '/files/a.txt',
        totalBytes: 1024,
        bytesTransferred: 0
      }
    })
    expect(next).toBe(state)
  })
})

describe('transferSessionReducer — misc', () => {
  it('set_error sets a typed generic transfer error by default', () => {
    const next = apply(make(), { type: 'set_error', message: 'broken' })
    expect(next.errorCode).toBe(TRANSFER_ERROR_CODES.transferFailed)
    expect(next.errorMessage).toBe('broken')
  })

  it('set_error can store a typed download error', () => {
    const next = apply(make(), {
      type: 'set_error',
      code: TRANSFER_ERROR_CODES.downloadFailed,
      message: 'disk full'
    })
    expect(next.errorCode).toBe(TRANSFER_ERROR_CODES.downloadFailed)
    expect(next.errorMessage).toBe('disk full')
  })

  it('role_changed: null clears all session-specific fields', () => {
    const state = make({
      role: 'sender',
      selectedFiles: [{ name: 'a', path: '/a', size: 1 }],
      uploadItems: [{ name: 'a', path: '/a', size: 1, status: 'uploading' }]
    })
    const next = apply(state, { type: 'role_changed', role: null })
    expect(next.role).toBeNull()
    expect(next.selectedFiles).toEqual([])
    expect(next.uploadItems).toEqual([])
  })

  it('request_pair_peer does not downgrade an already-paired peer', () => {
    const state = make({
      remember: {
        pairStatus: { abc: 'paired' },
        peerDisplayNames: {},
        incomingRequest: null,
        incomingInvite: null,
        inviteResponses: {}
      }
    })
    const next = apply(state, { type: 'request_pair_peer', peerKey: 'abc' })
    expect(next).toBe(state)
  })

  it('forget_peer removes the peer and related remembered state', () => {
    const peerKey = 'a'.repeat(64)
    const otherPeerKey = 'b'.repeat(64)
    const state = make({
      peers: [rememberedPeer(peerKey), rememberedPeer(otherPeerKey)],
      remember: {
        pairStatus: { [peerKey]: 'paired', [otherPeerKey]: 'paired' },
        peerDisplayNames: { [peerKey]: 'Phone', [otherPeerKey]: 'Tablet' },
        incomingRequest: null,
        incomingInvite: {
          remoteDevicePubkey: peerKey,
          displayName: 'Phone',
          deviceType: 'phone',
          topic: 'd'.repeat(64)
        },
        inviteResponses: {
          [peerKey]: {
            remoteDevicePubkey: peerKey,
            topic: 'd'.repeat(64),
            response: 'declined',
            receivedAt: 1
          },
          [otherPeerKey]: {
            remoteDevicePubkey: otherPeerKey,
            topic: 'e'.repeat(64),
            response: 'declined',
            receivedAt: 1
          }
        }
      }
    })

    const next = apply(state, { type: 'forget_peer', peerKey })

    expect(next.peers.map((peer) => peer.remoteDevicePubkey)).toEqual([otherPeerKey])
    expect(next.remember.pairStatus).toEqual({ [otherPeerKey]: 'paired' })
    expect(next.remember.peerDisplayNames).toEqual({ [otherPeerKey]: 'Tablet' })
    expect(next.remember.incomingInvite).toBeNull()
    expect(next.remember.inviteResponses).toEqual({
      [otherPeerKey]: {
        remoteDevicePubkey: otherPeerKey,
        topic: 'e'.repeat(64),
        response: 'declined',
        receivedAt: 1
      }
    })
  })
})
