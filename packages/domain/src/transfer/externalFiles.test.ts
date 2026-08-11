import { describe, expect, it, beforeEach, vi } from 'vitest'
import { bindTransferApi } from './binding'
import { receiveExternalFiles } from './externalFiles'
import { initialTransferSessionState } from './reducer'
import { transferStore } from './store'
import type { TransferApi } from './binding'
import { MAX_FILES_PER_TRANSFER, type TransferRPC } from '@altersend/core'
import type { SelectedFile } from '../send/draftTypes'

const file = (name: string): SelectedFile => ({ name, path: `/tmp/${name}` })

let hosted: number
let shared: number
let disconnected: number

function bindWorker(): void {
  hosted = 0
  shared = 0
  disconnected = 0
  bindTransferApi({
    worker: {
      host: () => {
        hosted++
        return Promise.resolve({ topic: 'b'.repeat(64) })
      },
      shareFiles: () => {
        shared++
        return Promise.resolve({ files: [] })
      },
      disconnect: () => {
        disconnected++
        return Promise.resolve({ ok: true })
      }
    } as unknown as TransferRPC,
    startP2P: () => Promise.resolve(),
    onTransferEvent: () => () => {}
  } as TransferApi)
}

beforeEach(() => {
  transferStore.setState({ ...initialTransferSessionState })
  bindWorker()
})

describe('receiveExternalFiles', () => {
  it('shares immediately when the app is idle', async () => {
    const result = await receiveExternalFiles([file('a.txt')])

    expect(result.status).toBe('shared')
    expect(hosted).toBe(1)
    expect(shared).toBe(1)
    expect(transferStore.getState().selectedFiles.map((f) => f.name)).toEqual(['a.txt'])
  })

  it('ignores an empty batch', async () => {
    expect(await receiveExternalFiles([])).toEqual({ status: 'ignored' })
    expect(hosted).toBe(0)
  })

  it('appends to an unsent draft instead of hijacking it', async () => {
    transferStore.setState({ selectedFiles: [file('draft.txt')], draftPhase: 'selected' })

    const result = await receiveExternalFiles([file('b.txt')])

    expect(result.status).toBe('selected')
    expect(hosted).toBe(0)
    expect(transferStore.getState().selectedFiles.map((f) => f.name)).toEqual([
      'draft.txt',
      'b.txt'
    ])
  })

  it('blocks without touching an active session', async () => {
    transferStore.setState({ role: 'receiver' })

    const result = await receiveExternalFiles([file('a.txt')])

    expect(result.status).toBe('blocked')
    expect(disconnected).toBe(0)
    expect(transferStore.getState().role).toBe('receiver')
  })

  it('blocks while a share is still being prepared', async () => {
    transferStore.setState({ draftPhase: 'preparing' })

    expect((await receiveExternalFiles([file('a.txt')])).status).toBe('blocked')
    expect(hosted).toBe(0)
  })

  it('ends the active session first when forced', async () => {
    transferStore.setState({ role: 'sender', selectedFiles: [file('old.txt')] })

    const result = await receiveExternalFiles([file('new.txt')], { force: true })

    expect(result.status).toBe('shared')
    expect(disconnected).toBe(1)
    expect(transferStore.getState().selectedFiles.map((f) => f.name)).toEqual(['new.txt'])
  })

  it('selects but does not share when the batch exceeds the file limit', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    const many = Array.from({ length: MAX_FILES_PER_TRANSFER + 1 }, (_, i) => file(`f${i}.txt`))

    const result = await receiveExternalFiles(many)

    expect(result).toEqual({ status: 'selected' })
    expect(hosted).toBe(0)
    expect(transferStore.getState().selectedFiles).toHaveLength(many.length)
  })
})
