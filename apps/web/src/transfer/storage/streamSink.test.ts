import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { startStreamDownload, type StreamDownload } from './streamClient'
import { StreamSink } from './streamSink'

vi.mock('./streamClient', () => ({ startStreamDownload: vi.fn(), FLUSH_GRACE_MS: 5000 }))

const mockedStart = vi.mocked(startStreamDownload)

function fakeDownload() {
  const chunks: number[][] = []
  const writer = {
    chunks,
    write: vi.fn(async (data: Uint8Array) => {
      chunks.push([...data])
    }),
    close: vi.fn(async () => {}),
    abort: vi.fn(async () => {})
  }
  const removeFrame = vi.fn()
  mockedStart.mockResolvedValue({ writer, removeFrame } as unknown as StreamDownload)
  return { writer, removeFrame, chunks }
}

describe('StreamSink', () => {
  beforeEach(() => {
    mockedStart.mockReset()
    vi.useFakeTimers()
  })
  afterEach(() => {
    vi.useRealTimers()
  })

  it('streams sequential chunks straight to disk in order', async () => {
    const { chunks } = fakeDownload()

    const sink = new StreamSink('movie.mp4')
    await sink.allocate(6)
    await sink.write(0, new Uint8Array([1, 2, 3]))
    await sink.write(3, new Uint8Array([4, 5, 6]))

    expect(mockedStart).toHaveBeenCalledWith('movie.mp4', 6)
    expect(chunks).toEqual([
      [1, 2, 3],
      [4, 5, 6]
    ])
  })

  it('throws if a write happens before allocate', async () => {
    const sink = new StreamSink('x')
    await expect(sink.write(0, new Uint8Array([1]))).rejects.toThrow(/before allocate/)
  })

  it('rejects a non-sequential write and never forwards the bad chunk', async () => {
    const { chunks } = fakeDownload()

    const sink = new StreamSink('x')
    await sink.allocate(10)
    await sink.write(0, new Uint8Array([1, 2]))

    await expect(sink.write(5, new Uint8Array([9]))).rejects.toThrow(/non-sequential/)
    expect(chunks).toEqual([[1, 2]])
  })

  it('finalize closes the writer and drops the frame only after a flush grace', async () => {
    const { writer, removeFrame } = fakeDownload()

    const sink = new StreamSink('x')
    await sink.allocate(0)
    await sink.finalize()

    expect(writer.close).toHaveBeenCalledOnce()
    expect(removeFrame).not.toHaveBeenCalled()
    vi.advanceTimersByTime(5000)
    expect(removeFrame).toHaveBeenCalledOnce()
  })

  it('abort swallows writer errors and removes the frame immediately', async () => {
    const { writer, removeFrame } = fakeDownload()
    writer.abort = vi.fn(async () => {
      throw new Error('already closed')
    })

    const sink = new StreamSink('x')
    await sink.allocate(0)
    await expect(sink.abort()).resolves.toBeUndefined()
    expect(removeFrame).toHaveBeenCalledOnce()
  })
})
