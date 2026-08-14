import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { RendererTransferEvent } from '@altersend/core'
import { bindTransferApi, discardPendingProgress } from './binding'
import { initialTransferSessionState } from './reducer'
import { transferStore } from './store'
import { setAppActive } from './effects/appActive'

const FILE_ID = 'file-1'

const OFFER = {
  id: FILE_ID,
  transferId: 'tx-1',
  name: 'a.bin',
  path: 'a.bin',
  size: 1000,
  kind: 'file'
} as const

function progressEvent(bytesTransferred: number): RendererTransferEvent {
  return {
    type: 'status',
    state: 'download-progress',
    fileId: FILE_ID,
    file: 'a.bin',
    path: 'a.bin',
    bytesTransferred,
    totalBytes: 1000
  } as RendererTransferEvent
}

function terminalEvent(): RendererTransferEvent {
  return {
    type: 'status',
    state: 'downloaded',
    fileId: FILE_ID,
    file: 'a.bin',
    path: 'a.bin',
    totalBytes: 1000,
    savedTo: '/tmp/a.bin'
  } as RendererTransferEvent
}

let emit: (event: RendererTransferEvent) => void
let unbind: () => void

function bytesInStore(): number {
  return transferStore.getState().receiveDownloadStates[FILE_ID]?.bytesTransferred ?? -1
}

beforeEach(() => {
  vi.useFakeTimers()
  transferStore.setState(
    { ...initialTransferSessionState, role: 'receiver', incomingFileOffers: [OFFER] },
    true
  )
  unbind = bindTransferApi({
    worker: { peersList: () => Promise.resolve([]) } as never,
    startP2P: () => Promise.resolve(),
    onTransferEvent: (cb) => {
      emit = cb
      return () => {}
    }
  })
})

afterEach(() => {
  unbind()
  discardPendingProgress()
  setAppActive(true)
  vi.useRealTimers()
})

describe('progress coalescing', () => {
  it('defers progress behind a timer while the app is active', () => {
    setAppActive(true)
    emit(progressEvent(100))
    expect(bytesInStore()).toBe(-1)

    vi.advanceTimersByTime(100)
    expect(bytesInStore()).toBe(100)
  })

  it('dispatches without a timer while the app is backgrounded', () => {
    setAppActive(false)
    emit(progressEvent(100))

    expect(bytesInStore()).toBe(100)
  })

  it('rate limits background dispatches to the flush interval', () => {
    setAppActive(false)
    emit(progressEvent(100))
    emit(progressEvent(200))

    expect(bytesInStore()).toBe(100)
  })

  it('delivers a rate limited update without waiting for another event', () => {
    setAppActive(false)
    emit(progressEvent(100))
    emit(progressEvent(200))

    vi.advanceTimersByTime(100)

    expect(bytesInStore()).toBe(200)
  })

  it('flushes pending progress when the clock steps backwards', () => {
    setAppActive(false)
    emit(progressEvent(100))

    vi.setSystemTime(Date.now() - 60_000)
    emit(progressEvent(200))

    expect(bytesInStore()).toBe(200)
  })

  it('flushes pending progress before a terminal event', () => {
    setAppActive(false)
    emit(progressEvent(100))
    vi.advanceTimersByTime(10)
    emit(progressEvent(900))
    emit(terminalEvent())

    expect(transferStore.getState().receiveDownloadStates[FILE_ID]?.status).toBe('completed')
  })

  it('drops queued progress when the session disconnects', () => {
    setAppActive(false)
    emit(progressEvent(100))
    vi.advanceTimersByTime(10)
    emit(progressEvent(900))

    emit({ type: 'status', state: 'disconnected', peers: 0 } as RendererTransferEvent)
    setAppActive(true)
    vi.advanceTimersByTime(1000)

    expect(bytesInStore()).toBe(-1)
  })
})
