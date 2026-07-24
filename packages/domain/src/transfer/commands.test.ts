import { describe, expect, it, beforeEach, vi } from 'vitest'
import { bindTransferApi } from './binding'
import { renamePeer } from './commands'
import { initialTransferSessionState } from './reducer'
import { transferStore } from './store'
import type { TransferApi } from './binding'
import type { RememberedPeer, TransferRPC } from '@altersend/core'

const KEY = 'a'.repeat(64)

const peer = (displayName: string): RememberedPeer => ({
  remoteDevicePubkey: KEY,
  rendezvousTopic: 'c'.repeat(64),
  displayName,
  deviceType: 'laptop',
  isMine: false,
  autoAccept: false,
  blocked: false,
  pairedAt: 1,
  lastSeenAt: 2
})

function bindWorker(worker: Partial<TransferRPC>): void {
  bindTransferApi({
    worker: worker as TransferRPC,
    startP2P: () => Promise.resolve(),
    onTransferEvent: () => () => {}
  } as TransferApi)
}

beforeEach(() => {
  transferStore.setState({
    ...initialTransferSessionState,
    peers: [peer('Phone')],
    remember: { ...initialTransferSessionState.remember, peerDisplayNames: { [KEY]: 'Phone' } }
  })
})

describe('renamePeer', () => {
  it('returns true and keeps the new name when the store persisted it', async () => {
    bindWorker({
      renamePeer: () => Promise.resolve(peer('Work Phone')),
      peersList: () => Promise.resolve([peer('Work Phone')])
    })

    expect(await renamePeer(KEY, 'Work Phone')).toBe(true)
    expect(transferStore.getState().peers[0].displayName).toBe('Work Phone')
    expect(transferStore.getState().remember.peerDisplayNames[KEY]).toBe('Work Phone')
  })

  it('returns false and reverts when the store wrote nothing', async () => {
    bindWorker({
      renamePeer: () => Promise.resolve(null),
      peersList: () => Promise.resolve([peer('Phone')])
    })

    expect(await renamePeer(KEY, 'Work Phone')).toBe(false)
    expect(transferStore.getState().peers[0].displayName).toBe('Phone')
    expect(transferStore.getState().remember.peerDisplayNames[KEY]).toBe('Phone')
  })

  it('reverts the display-name cache when the RPC throws', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    bindWorker({
      renamePeer: () => Promise.reject(new Error('store locked')),
      peersList: () => Promise.resolve([peer('Phone')])
    })

    expect(await renamePeer(KEY, 'Work Phone')).toBe(false)
    expect(transferStore.getState().remember.peerDisplayNames[KEY]).toBe('Phone')
  })

  it('reverts the cache when the peer is not in the loaded list yet', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    transferStore.setState({
      ...initialTransferSessionState,
      peers: [],
      remember: { ...initialTransferSessionState.remember, peerDisplayNames: { [KEY]: 'Phone' } }
    })
    bindWorker({
      renamePeer: () => Promise.reject(new Error('store locked')),
      peersList: () => Promise.resolve([])
    })

    expect(await renamePeer(KEY, 'Work Phone')).toBe(false)
    expect(transferStore.getState().remember.peerDisplayNames[KEY]).toBe('Phone')
  })

  it('rejects an empty name without dispatching', async () => {
    bindWorker({
      renamePeer: () => Promise.reject(new Error('should not be called')),
      peersList: () => Promise.resolve([peer('Phone')])
    })

    expect(await renamePeer(KEY, '   ')).toBe(false)
    expect(transferStore.getState().peers[0].displayName).toBe('Phone')
  })
})
