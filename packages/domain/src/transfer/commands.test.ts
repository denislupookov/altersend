import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { TransferRPC } from '@altersend/core'
import type { TransferApi } from './binding'
import { bindTransferApi } from './binding'
import { continueShare } from './commands'
import { initialTransferSessionState } from './reducer'
import { transferStore } from './store'

function deferred<T>() {
  let resolve!: (value: T) => void
  let reject!: (error: unknown) => void
  const promise = new Promise<T>((res, rej) => {
    resolve = res
    reject = rej
  })
  return { promise, resolve, reject }
}

describe('continueShare', () => {
  let unbind: () => void

  beforeEach(() => {
    unbind?.()
    transferStore.setState(initialTransferSessionState, true)
  })

  it('reveals the share code after hosting, before file staging finishes', async () => {
    const share = deferred<{ acceptedFiles: number }>()
    const worker: TransferRPC = {
      host: async () => ({ topic: 'a'.repeat(64) }),
      join: async () => ({ state: 'joined' }),
      shareFiles: async () => share.promise,
      downloadFiles: async () => ({ files: [] }),
      disconnect: async () => ({ state: 'disconnected' }),
      closePeers: async () => {}
    }
    const api: TransferApi = {
      worker,
      startP2P: async () => true,
      onTransferEvent: () => () => {}
    }
    unbind = bindTransferApi(api)

    const sending = continueShare([{ name: 'photo.jpg', path: '/tmp/photo.jpg', size: 1 }])
    await vi.waitFor(() => {
      expect(transferStore.getState().topic).toBe('a'.repeat(64))
    })

    expect(transferStore.getState().topic).toBe('a'.repeat(64))
    expect(transferStore.getState().draftPhase).toBe('ready')

    share.resolve({ acceptedFiles: 1 })
    await sending
    expect(transferStore.getState().uploadItems[0]?.status).toBe('completed')
  })

  it('restores selected phase when staging fails after code reveal', async () => {
    const worker: TransferRPC = {
      host: async () => ({ topic: 'b'.repeat(64) }),
      join: async () => ({ state: 'joined' }),
      shareFiles: async () => {
        throw new Error('cannot read file')
      },
      downloadFiles: async () => ({ files: [] }),
      disconnect: async () => ({ state: 'disconnected' }),
      closePeers: async () => {}
    }
    const api: TransferApi = {
      worker,
      startP2P: async () => true,
      onTransferEvent: () => () => {}
    }
    unbind = bindTransferApi(api)

    await continueShare([{ name: 'photo.jpg', path: '/tmp/photo.jpg', size: 1 }])

    expect(transferStore.getState().draftPhase).toBe('selected')
    expect(transferStore.getState().errorMessage).toBe('cannot read file')
  })
})
