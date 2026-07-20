import { describe, it, expect } from 'vitest'
import { ReceiverSession } from '../src/engine/receiver'
import { SenderSession } from '../src/engine/sender'
import { selectChunkSize, chunkCount, chunkRange } from '../src/engine/chunker'
import type { ChunkHeader, ChunkWriter, ControlMessage, DriveChannel } from '../src/engine/types'

class MemoryWriter implements ChunkWriter {
  bytes = new Uint8Array(0)
  allocations = 0

  async allocate(size: number): Promise<void> {
    this.allocations++
    this.bytes = new Uint8Array(size)
  }

  async write(offset: number, data: Uint8Array): Promise<void> {
    this.bytes.set(data, offset)
  }

  async readBack(offset: number, length: number): Promise<Uint8Array | null> {
    return this.bytes.subarray(offset, offset + length)
  }

  async finalize(): Promise<string> {
    return '/saved'
  }

  async abort(): Promise<void> {}
}

function loopback() {
  const sent: ControlMessage[] = []
  let onMessage: ((m: ControlMessage) => void) | undefined
  let onChunk: ((h: ChunkHeader, d: Uint8Array) => void) | undefined
  const channel: DriveChannel = {
    send: (m) => sent.push(m),
    sendChunk: (h, d) => onChunk?.(h, d),
    onMessage: (h) => {
      onMessage = h
    },
    onChunk: (h) => {
      onChunk = h
    },
    bufferedAmount: () => 0,
    close: () => {}
  }
  return {
    channel,
    sent,
    deliver: (m: ControlMessage) => onMessage?.(m)
  }
}

describe('sender re-announcing start', () => {
  it('does not reset receiver progress or double-count bytes', async () => {
    const size = 4 * 1024 * 1024
    const chunkSize = selectChunkSize(size)
    const total = chunkCount(size, chunkSize)
    const source = new Uint8Array(size).fill(7)

    const writer = new MemoryWriter()
    const link = loopback()
    const progress: number[] = []
    const receiver = new ReceiverSession(writer, link.channel, {
      transferId: 't1',
      onProgress: (bytes) => progress.push(bytes)
    })
    receiver.receive().catch(() => {})

    link.deliver({ type: 'start', transferId: 't1', name: 'f', size, chunkSize })
    await new Promise((r) => setTimeout(r, 0))

    const half = Math.floor(total / 2)
    for (let i = 0; i < half; i++) {
      const { offset, length } = chunkRange(i, size, chunkSize)
      const data = source.subarray(offset, offset + length)
      link.channel.sendChunk({ transferId: 't1', index: i }, data)
    }
    await new Promise((r) => setTimeout(r, 0))

    const beforeRestart = progress[progress.length - 1]
    expect(beforeRestart).toBeLessThanOrEqual(size)

    link.deliver({ type: 'start', transferId: 't1', name: 'f', size, chunkSize })
    await new Promise((r) => setTimeout(r, 0))

    expect(writer.allocations).toBe(1)

    const needs = link.sent.filter((m) => m.type === 'need')
    expect(needs).toHaveLength(2)
    const second = needs[1] as Extract<ControlMessage, { type: 'need' }>
    expect(second.indices).toHaveLength(total - half)
    expect(second.indices[0]).toBe(half)

    for (const bytes of progress) expect(bytes).toBeLessThanOrEqual(size)
  })
})

describe('sender need handling', () => {
  it('serves a second need after the first completes', async () => {
    const size = 8
    const source = new Uint8Array(size).fill(3)
    const chunks: number[] = []

    let onMessage: ((m: ControlMessage) => void) | undefined
    const channel: DriveChannel = {
      send: () => {},
      sendChunk: (h) => chunks.push(h.index),
      onMessage: (h) => {
        onMessage = h
      },
      onChunk: () => {},
      bufferedAmount: () => 0,
      close: () => {}
    }

    const reader = {
      size: async () => size,
      read: async (offset: number, length: number) => source.subarray(offset, offset + length),
      close: async () => {}
    }

    const sender = new SenderSession(reader, channel, { transferId: 't1', name: 'f' })
    sender.start().catch(() => {})
    await new Promise((r) => setTimeout(r, 0))

    onMessage?.({ type: 'need', transferId: 't1', indices: [0] })
    await new Promise((r) => setTimeout(r, 10))
    expect(chunks).toEqual([0])

    onMessage?.({ type: 'need', transferId: 't1', indices: [0] })
    await new Promise((r) => setTimeout(r, 10))
    expect(chunks).toEqual([0, 0])
  })
})

describe('DiskWriter directories', () => {
  it('creates missing parent directories for nested folder downloads', async () => {
    const os = await import('os')
    const p = await import('path')
    const fsp = await import('fs/promises')
    const { DiskWriter } = await import('../src/adapters/disk-writer')

    const root = await fsp.mkdtemp(p.join(os.tmpdir(), 'drive-nested-'))
    const nested = p.join(root, 'MyFolder', 'sub', 'file.bin')
    const writer = new DiskWriter(nested)

    await writer.allocate(4)
    await writer.write(0, new Uint8Array([1, 2, 3, 4]))
    const saved = await writer.finalize()

    expect(saved).toBe(nested)
    expect(await fsp.readFile(nested)).toEqual(Buffer.from([1, 2, 3, 4]))
    await fsp.rm(root, { recursive: true, force: true })
  })
})

describe('DiskWriter overwrite', () => {
  it('replaces the target when overwrite is set, uniquifies otherwise', async () => {
    const os = await import('os')
    const p = await import('path')
    const fsp = await import('fs/promises')
    const { DiskWriter } = await import('../src/adapters/disk-writer')

    const root = await fsp.mkdtemp(p.join(os.tmpdir(), 'drive-ow-'))
    const target = p.join(root, 'a.bin')
    await fsp.writeFile(target, 'OLD')

    const uniq = new DiskWriter(target)
    await uniq.allocate(3)
    await uniq.write(0, new Uint8Array([1, 2, 3]))
    expect(await uniq.finalize()).toBe(p.join(root, 'a (1).bin'))
    expect(await fsp.readFile(target, 'utf8')).toBe('OLD')

    const over = new DiskWriter(target, { overwrite: true })
    await over.allocate(3)
    await over.write(0, new Uint8Array([9, 9, 9]))
    expect(await over.finalize()).toBe(target)
    expect(await fsp.readFile(target)).toEqual(Buffer.from([9, 9, 9]))

    await fsp.rm(root, { recursive: true, force: true })
  })
})

describe('Bitmap length validation', () => {
  it('rejects a bitmap that is longer than the geometry requires', async () => {
    const { Bitmap } = await import('../src/engine/bitmap')
    expect(() => new Bitmap(8, new Uint8Array(1))).not.toThrow()
    expect(() => new Bitmap(8, new Uint8Array(2))).toThrow(/expected 1/)
    expect(() => new Bitmap(8, new Uint8Array(0))).toThrow(/expected 1/)
  })
})

describe('stall timeout', () => {
  it('fails a receiver whose peer goes silent instead of hanging forever', async () => {
    const writer = new MemoryWriter()
    const link = loopback()
    const receiver = new ReceiverSession(writer, link.channel, {
      transferId: 't1',
      stallTimeoutMs: 40
    })
    const settled = receiver.receive().then(
      () => 'resolved',
      (err: Error) => err.message
    )

    link.deliver({ type: 'start', transferId: 't1', name: 'f', size: 1024, chunkSize: 65536 })
    await new Promise((r) => setTimeout(r, 10))

    expect(await settled).toMatch(/No data from sender/)
  })

  it('does not fire while chunks keep arriving', async () => {
    const size = 4096
    const chunkSize = selectChunkSize(size)
    const total = chunkCount(size, chunkSize)
    const source = new Uint8Array(size).fill(2)

    const writer = new MemoryWriter()
    const link = loopback()
    const receiver = new ReceiverSession(writer, link.channel, {
      transferId: 't1',
      stallTimeoutMs: 60
    })
    const settled = receiver.receive().then(
      () => 'resolved',
      (err: Error) => err.message
    )

    link.deliver({ type: 'start', transferId: 't1', name: 'f', size, chunkSize })
    for (let i = 0; i < total; i++) {
      await new Promise((r) => setTimeout(r, 40))
      const { offset, length } = chunkRange(i, size, chunkSize)
      const data = source.subarray(offset, offset + length)
      link.channel.sendChunk({ transferId: 't1', index: i }, data)
    }
    await new Promise((r) => setTimeout(r, 10))
    link.deliver({ type: 'complete', transferId: 't1', fileHash: '' })

    expect(await settled).toBe('resolved')
  })
})

describe('partial preservation', () => {
  it('does not tag a premature complete as an integrity failure', async () => {
    const writer = new MemoryWriter()
    const link = loopback()
    const receiver = new ReceiverSession(writer, link.channel, { transferId: 't1' })
    const settled = receiver.receive().then(
      () => null,
      (err: Error) => err
    )

    link.deliver({ type: 'start', transferId: 't1', name: 'f', size: 4096, chunkSize: 65536 })
    await new Promise((r) => setTimeout(r, 0))
    link.deliver({ type: 'complete', transferId: 't1', fileHash: '' })

    const err = await settled
    expect(err?.message).toMatch(/incomplete/)
    expect(err?.name).not.toBe('IntegrityError')
  })
})

describe('progress reporting', () => {
  it('does not emit one event per chunk', async () => {
    const size = 16 * 1024 * 1024
    const chunkSize = selectChunkSize(size)
    const total = chunkCount(size, chunkSize)
    const source = new Uint8Array(size).fill(5)

    const writer = new MemoryWriter()
    const link = loopback()
    const ticks: number[] = []
    const receiver = new ReceiverSession(writer, link.channel, {
      transferId: 't1',
      onProgress: (bytes) => ticks.push(bytes)
    })
    receiver.receive().catch(() => {})

    link.deliver({ type: 'start', transferId: 't1', name: 'f', size, chunkSize })
    await new Promise((r) => setTimeout(r, 0))
    for (let i = 0; i < total; i++) {
      const { offset, length } = chunkRange(i, size, chunkSize)
      link.channel.sendChunk(
        { transferId: 't1', index: i },
        source.subarray(offset, offset + length)
      )
    }
    await new Promise((r) => setTimeout(r, 20))

    expect(total).toBeGreaterThan(20)
    expect(ticks.length).toBeLessThan(total)
    expect(ticks[ticks.length - 1]).toBe(size)
  })
})

describe('stale chunks from a superseded send', () => {
  it('ignores chunks that arrive before this session knows the geometry', async () => {
    const writer = new MemoryWriter()
    const link = loopback()
    const receiver = new ReceiverSession(writer, link.channel, { transferId: 't1' })
    const settled = receiver.receive().then(
      () => 'resolved',
      (err: Error) => err.message
    )

    const size = 4096
    const chunkSize = selectChunkSize(size)
    const source = new Uint8Array(size).fill(1)

    link.channel.sendChunk({ transferId: 't1', index: 0 }, source.subarray(0, chunkSize))
    await new Promise((r) => setTimeout(r, 0))

    link.deliver({ type: 'start', transferId: 't1', name: 'f', size, chunkSize })
    await new Promise((r) => setTimeout(r, 0))
    for (let i = 0; i < chunkCount(size, chunkSize); i++) {
      const { offset, length } = chunkRange(i, size, chunkSize)
      link.channel.sendChunk(
        { transferId: 't1', index: i },
        source.subarray(offset, offset + length)
      )
    }
    await new Promise((r) => setTimeout(r, 0))
    link.deliver({ type: 'complete', transferId: 't1', fileHash: '' })

    expect(await settled).toBe('resolved')
  })
})
