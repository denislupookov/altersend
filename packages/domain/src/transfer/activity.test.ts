import { describe, expect, it } from 'vitest'
import type { IncomingFileOffer } from '@altersend/core'
import { getTransferActivity } from './activity'
import { initialTransferSessionState } from './reducer'
import type { TransferSessionState } from './types'
import type { DownloadItemState } from '../receive/downloadModel'
import type { PeerDownloadEvent } from '../send/shareModel'

const make = (overrides: Partial<TransferSessionState> = {}): TransferSessionState => ({
  ...initialTransferSessionState,
  ...overrides
})

const offer = (id: string, size = 1000): IncomingFileOffer => ({
  id,
  transferId: 'tx-1',
  name: `${id}.bin`,
  path: `/files/${id}.bin`,
  size,
  driveKey: 'drive-1',
  kind: 'file'
})

const downloadState = (overrides: Partial<DownloadItemState> = {}): DownloadItemState => ({
  status: 'idle',
  bytesTransferred: 0,
  totalBytes: 1000,
  ...overrides
})

const peerEvent = (overrides: Partial<PeerDownloadEvent> = {}): PeerDownloadEvent => ({
  id: 'peer-1:a',
  peerKey: 'peer-1',
  fileName: 'a.bin',
  state: 'progress',
  bytesTransferred: 500,
  totalBytes: 1000,
  updatedAt: 1,
  ...overrides
})

describe('getTransferActivity', () => {
  it('is idle without a role', () => {
    expect(getTransferActivity(make()).active).toBe(false)
  })

  it('tracks receiver downloads in flight', () => {
    const activity = getTransferActivity(
      make({
        role: 'receiver',
        incomingFileOffers: [offer('a')],
        receiveDownloadStates: {
          a: downloadState({ status: 'downloading', bytesTransferred: 250 })
        }
      })
    )

    expect(activity.active).toBe(true)
    expect(activity.role).toBe('receiver')
    expect(activity.percent).toBe(25)
  })

  it('stays active between queued files so the service is not torn down mid-batch', () => {
    const activity = getTransferActivity(
      make({
        role: 'receiver',
        incomingFileOffers: [offer('a'), offer('b')],
        receiveDownloadStates: {
          a: downloadState({ status: 'completed', bytesTransferred: 1000 }),
          b: downloadState({ queued: true })
        }
      })
    )

    expect(activity.active).toBe(true)
  })

  it('goes inactive once the receiver batch finishes and files are routed', () => {
    const activity = getTransferActivity(
      make({
        role: 'receiver',
        incomingFileOffers: [offer('a')],
        receiveDownloadStates: {
          a: downloadState({
            status: 'completed',
            bytesTransferred: 1000,
            destination: 'filesystem'
          })
        }
      })
    )

    expect(activity.active).toBe(false)
    expect(activity.settled).toBe(true)
  })

  it('tracks sender uploads while a peer is downloading', () => {
    const activity = getTransferActivity(
      make({ role: 'sender', peerDownloads: { 'peer-1:a': peerEvent() } })
    )

    expect(activity.active).toBe(true)
    expect(activity.role).toBe('sender')
    expect(activity.percent).toBe(50)
  })

  it('measures a downloading peer against the whole share, not just its current file', () => {
    const activity = getTransferActivity(
      make({
        role: 'sender',
        uploadItems: [
          { name: 'a', path: '/a', size: 1000, status: 'completed' },
          { name: 'b', path: '/b', size: 1000, status: 'uploading' }
        ],
        peerDownloads: {
          'peer-1:a': peerEvent({ state: 'completed', bytesTransferred: 1000 }),
          'peer-1:b': peerEvent({ id: 'peer-1:b', fileName: 'b.bin', state: 'progress' })
        }
      })
    )

    expect(activity.phase).toBe('transferring')
    expect(activity.percent).toBe(75)
  })

  it('scales the total by the number of peers actually downloading', () => {
    const activity = getTransferActivity(
      make({
        role: 'sender',
        connectedPeers: {
          'peer-1': { peerKey: 'peer-1', connectedAt: 1 },
          'peer-2': { peerKey: 'peer-2', connectedAt: 2 }
        },
        uploadItems: [{ name: 'a', path: '/a', size: 1000, status: 'uploading' }],
        peerDownloads: {
          'peer-1:a': peerEvent(),
          'peer-2:a': peerEvent({ id: 'peer-2:a', peerKey: 'peer-2' })
        }
      })
    )

    expect(activity.deviceCount).toBe(2)
    expect(activity.percent).toBe(50)
  })

  it('does not report a finished share as complete while still waiting for devices', () => {
    const activity = getTransferActivity(
      make({
        role: 'sender',
        draftPhase: 'ready',
        connectedPeers: { 'peer-1': { peerKey: 'peer-1', connectedAt: 1 } },
        uploadItems: [{ name: 'a', path: '/a', size: 1000, status: 'completed' }],
        peerDownloads: {
          'peer-1:a': peerEvent({ state: 'completed', bytesTransferred: 1000 })
        }
      })
    )

    expect(activity.active).toBe(true)
    expect(activity.phase).toBe('waiting')
    expect(activity.deviceCount).toBe(1)
    expect(activity.receivedPeers.length).toBe(1)
    expect(activity.percent).toBe(0)
  })

  it('does not count a device that only received part of the share', () => {
    const activity = getTransferActivity(
      make({
        role: 'sender',
        draftPhase: 'ready',
        uploadItems: [
          { name: 'a', path: '/a', size: 1000, status: 'completed' },
          { name: 'b', path: '/b', size: 1000, status: 'completed' }
        ],
        peerDownloads: {
          'peer-1:a': peerEvent({ state: 'completed', bytesTransferred: 1000 })
        }
      })
    )

    expect(activity.receivedPeers.length).toBe(0)
  })

  it('ignores text snippets when deciding a device received the share', () => {
    const activity = getTransferActivity(
      make({
        role: 'sender',
        draftPhase: 'ready',
        uploadItems: [
          { name: 'a', path: '/a', size: 1000, status: 'completed' },
          { name: 'note', path: '/note', kind: 'text', content: 'hi', status: 'completed' }
        ],
        peerDownloads: {
          'peer-1:a': peerEvent({ state: 'completed', bytesTransferred: 1000 })
        }
      })
    )

    expect(activity.receivedPeers).toEqual(['peer-1'])
  })

  it('counts files with the same base name separately', () => {
    const activity = getTransferActivity(
      make({
        role: 'sender',
        draftPhase: 'ready',
        uploadItems: [
          { name: 'IMG.jpg', path: '/2024/IMG.jpg', size: 1000, status: 'completed' },
          { name: 'IMG.jpg', path: '/2025/IMG.jpg', size: 1000, status: 'completed' }
        ],
        peerDownloads: {
          'peer-1:a': peerEvent({ state: 'completed', fileName: 'IMG.jpg' }),
          'peer-1:b': peerEvent({ id: 'peer-1:b', state: 'completed', fileName: 'IMG.jpg' })
        }
      })
    )

    expect(activity.receivedPeers).toEqual(['peer-1'])
  })

  it('stays in transferring between files rather than flipping to waiting', () => {
    const activity = getTransferActivity(
      make({
        role: 'sender',
        draftPhase: 'ready',
        uploadItems: [
          { name: 'a', path: '/a', size: 1000, status: 'completed' },
          { name: 'b', path: '/b', size: 1000, status: 'uploading' }
        ],
        peerDownloads: {
          'peer-1:a': peerEvent({ state: 'completed', bytesTransferred: 1000 })
        }
      })
    )

    expect(activity.phase).toBe('transferring')
    expect(activity.percent).toBe(50)
  })

  it('keeps the receiver active until saved files are routed', () => {
    const activity = getTransferActivity(
      make({
        role: 'receiver',
        incomingFileOffers: [offer('a')],
        receiveDownloadStates: {
          a: downloadState({ status: 'completed', bytesTransferred: 1000, savedTo: '/tmp/a' })
        }
      })
    )

    expect(activity.active).toBe(true)
  })

  it('leaves sender gaps unsettled so brief pauses keep the service alive', () => {
    const activity = getTransferActivity(
      make({
        role: 'sender',
        peerDownloads: {
          'peer-1:a': peerEvent({ state: 'completed', bytesTransferred: 1000 })
        }
      })
    )

    expect(activity.active).toBe(false)
    expect(activity.settled).toBe(false)
  })

  it('leaves a failed receive unsettled so a reconnect has a grace window', () => {
    const activity = getTransferActivity(
      make({
        role: 'receiver',
        incomingFileOffers: [offer('a')],
        receiveDownloadStates: {
          a: downloadState({ status: 'failed', bytesTransferred: 400, resumable: true })
        }
      })
    )

    expect(activity.active).toBe(false)
    expect(activity.settled).toBe(false)
  })

  it('never settles a sender that has no peer downloads yet', () => {
    const activity = getTransferActivity(make({ role: 'sender' }))

    expect(activity.active).toBe(false)
    expect(activity.settled).toBe(false)
  })

  it('stays active while a share is published and waiting for a receiver', () => {
    const activity = getTransferActivity(
      make({
        role: 'sender',
        draftPhase: 'ready',
        uploadItems: [{ name: 'a', path: '/a', size: 1000, status: 'completed' }]
      })
    )

    expect(activity.active).toBe(true)
    expect(activity.phase).toBe('waiting')
  })

  it('reports connected devices instead of progress when nobody is downloading', () => {
    const activity = getTransferActivity(
      make({
        role: 'sender',
        draftPhase: 'ready',
        uploadItems: [{ name: 'a', path: '/a', size: 1000, status: 'completed' }],
        connectedPeers: {
          'peer-1': { peerKey: 'peer-1', connectedAt: 1 },
          'peer-2': { peerKey: 'peer-2', connectedAt: 2, disconnectedAt: 3 }
        }
      })
    )

    expect(activity.active).toBe(true)
    expect(activity.phase).toBe('waiting')
    expect(activity.deviceCount).toBe(1)
  })

  it('does not keep a text-only share alive, since nothing is downloaded', () => {
    const items = [
      { name: 'note', path: '/note', kind: 'text' as const, status: 'completed' as const }
    ]

    expect(getTransferActivity(make({ draftPhase: 'preparing', uploadItems: items })).active).toBe(
      false
    )
    expect(
      getTransferActivity(make({ role: 'sender', draftPhase: 'ready', uploadItems: items })).active
    ).toBe(false)
  })

  it('goes inactive once the share session is cleared', () => {
    const activity = getTransferActivity(make({ role: 'sender', draftPhase: 'empty' }))

    expect(activity.active).toBe(false)
  })

  it('reports staging as indeterminate progress', () => {
    const activity = getTransferActivity(
      make({
        draftPhase: 'preparing',
        uploadItems: [
          { name: 'a', path: '/a', status: 'completed' },
          { name: 'b', path: '/b', status: 'waiting' }
        ]
      })
    )

    expect(activity.active).toBe(true)
    expect(activity.phase).toBe('preparing')
  })
})
