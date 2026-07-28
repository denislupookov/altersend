import { beforeEach, describe, expect, it, vi } from 'vitest'
import { startStreamDownload } from './streamClient'
import { StreamSink } from './streamSink'

vi.mock('./streamClient', () => ({ startStreamDownload: vi.fn() }))

const mockedStart = vi.mocked(startStreamDownload)

function fakeWriter() {
  const chunks: number[][] = []
  return {
    chunks,
    write: vi.fn(async (data: Uint8Array) => {
      chunks.push([...data])
    }),
    close: vi.fn(async () => {}),
    abort: vi.fn(async () => {})
  }
}

type Writer = WritableStreamDefaultWriter<Uint8Array>

describe('StreamSink', () => {
  beforeEach(() => {
    mockedStart.mockReset()
  })

  it('streams sequential chunks straight to disk in order', async () => {
    const writer = fakeWriter()
    mockedStart.mockResolvedValue(writer as unknown as Writer)

    const sink = new StreamSink('movie.mp4')
    await sink.allocate(6)
    await sink.write(0, new Uint8Array([1, 2, 3]))
    await sink.write(3, new Uint8Array([4, 5, 6]))

    expect(mockedStart).toHaveBeenCalledWith('movie.mp4', 6)
    expect(writer.chunks).toEqual([
      [1, 2, 3],
      [4, 5, 6]
    ])
  })

  it('throws if a write happens before allocate', async () => {
    const sink = new StreamSink('x')
    await expect(sink.write(0, new Uint8Array([1]))).rejects.toThrow(/before allocate/)
  })

  it('rejects a non-sequential write and never forwards the bad chunk', async () => {
    const writer = fakeWriter()
    mockedStart.mockResolvedValue(writer as unknown as Writer)

    const sink = new StreamSink('x')
    await sink.allocate(10)
    await sink.write(0, new Uint8Array([1, 2]))

    await expect(sink.write(5, new Uint8Array([9]))).rejects.toThrow(/non-sequential/)
    expect(writer.chunks).toEqual([[1, 2]])
  })

  it('finalize closes the writer', async () => {
    const writer = fakeWriter()
    mockedStart.mockResolvedValue(writer as unknown as Writer)

    const sink = new StreamSink('x')
    await sink.allocate(0)
    await sink.finalize()

    expect(writer.close).toHaveBeenCalledOnce()
  })

  it('abort swallows writer errors so teardown never throws', async () => {
    const writer = fakeWriter()
    writer.abort = vi.fn(async () => {
      throw new Error('already closed')
    })
    mockedStart.mockResolvedValue(writer as unknown as Writer)

    const sink = new StreamSink('x')
    await sink.allocate(0)
    await expect(sink.abort()).resolves.toBeUndefined()
  })
})
