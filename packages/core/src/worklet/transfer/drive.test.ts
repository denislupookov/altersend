import { describe, it, expect } from 'vitest'
import { mkdtemp, writeFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import SecretStream from '@hyperswarm/secret-stream'
import Protomux from 'protomux'
import { Duplex } from 'streamx'
import { SenderSession, ReceiverSession } from '@altersend/drive'
import type { ChunkReader, ChunkWriter } from '@altersend/drive'
import type { PeerSocket } from 'hyperswarm'
import { PeerDrive } from './drive'

function socketPair(): [PeerSocket, PeerSocket] {
  const a = new Duplex({
    write(data: Uint8Array, cb: () => void) {
      b.push(data)
      cb()
    }
  })
  const b = new Duplex({
    write(data: Uint8Array, cb: () => void) {
      a.push(data)
      cb()
    }
  })
  return [
    new SecretStream(true, a) as unknown as PeerSocket,
    new SecretStream(false, b) as unknown as PeerSocket
  ]
}

class MemoryReader implements ChunkReader {
  constructor(private readonly bytes: Uint8Array) {}
  async size() {
    return this.bytes.length
  }
  async read(offset: number, length: number) {
    return this.bytes.subarray(offset, offset + length)
  }
  async close() {}
}

class MemoryWriter implements ChunkWriter {
  bytes = new Uint8Array(0)
  constructor(private readonly savedTo: string) {}
  async allocate(size: number) {
    if (this.bytes.length !== size) this.bytes = new Uint8Array(size)
  }
  async write(offset: number, data: Uint8Array) {
    this.bytes.set(data, offset)
  }
  async readBack(offset: number, length: number) {
    return this.bytes.subarray(offset, offset + length)
  }
  async finalize() {
    return this.savedTo
  }
  async abort() {}
}

function payload(size: number): Uint8Array {
  const bytes = new Uint8Array(size)
  for (let i = 0; i < size; i++) bytes[i] = (i * 31 + 11) & 0xff
  return bytes
}

describe('PeerDrive', () => {
  it('negotiates support when both peers speak drive', async () => {
    const [socketA, socketB] = socketPair()
    const a = PeerDrive.create(socketA)!
    const b = PeerDrive.create(socketB)!

    expect(await a.supported).toBe(true)
    expect(await b.supported).toBe(true)
  })

  it('reports unsupported against a peer that has no drive channel', async () => {
    const [socketA, socketB] = socketPair()
    const a = PeerDrive.create(socketA)!
    Protomux.from(socketB)

    expect(await a.supported).toBe(false)
  })

  it('carries a file end to end over the real protomux stream', async () => {
    const [socketA, socketB] = socketPair()
    const senderSide = PeerDrive.create(socketA)!
    const receiverSide = PeerDrive.create(socketB)!

    const input = payload(700 * 1024)
    const writer = new MemoryWriter('/saved/one.bin')

    const receiver = new ReceiverSession(writer, receiverSide.session('file-1'), {
      transferId: 'file-1'
    })
    const sender = new SenderSession(new MemoryReader(input), senderSide.session('file-1'), {
      transferId: 'file-1',
      name: 'one.bin'
    })

    const [savedTo] = await Promise.all([receiver.receive(), sender.start()])

    expect(savedTo).toBe('/saved/one.bin')
    expect(Buffer.from(writer.bytes).equals(Buffer.from(input))).toBe(true)
  })

  it('keeps concurrent files on one channel separate', async () => {
    const [socketA, socketB] = socketPair()
    const senderSide = PeerDrive.create(socketA)!
    const receiverSide = PeerDrive.create(socketB)!

    const inputs = [payload(300 * 1024), payload(120 * 1024)]
    const writers = [new MemoryWriter('/saved/a.bin'), new MemoryWriter('/saved/b.bin')]

    const transfers = inputs.map((input, i) => {
      const id = `file-${i}`
      const receiver = new ReceiverSession(writers[i], receiverSide.session(id), { transferId: id })
      const sender = new SenderSession(new MemoryReader(input), senderSide.session(id), {
        transferId: id,
        name: `${id}.bin`
      })
      return Promise.all([receiver.receive(), sender.start()])
    })

    await Promise.all(transfers)

    expect(Buffer.from(writers[0].bytes).equals(Buffer.from(inputs[0]))).toBe(true)
    expect(Buffer.from(writers[1].bytes).equals(Buffer.from(inputs[1]))).toBe(true)
  })

  it('cancels an in-flight serve() when the drive is destroyed', async () => {
    const [socketA, socketB] = socketPair()
    const senderSide = PeerDrive.create(socketA)!
    PeerDrive.create(socketB)!

    const dir = await mkdtemp(join(tmpdir(), 'peerdrive-'))
    const src = join(dir, 'in.bin')
    await writeFile(src, payload(64 * 1024))

    const serving = senderSide.serve('file-x', 'in.bin', src)
    await senderSide.supported

    senderSide.destroy()

    await expect(serving).rejects.toThrow('cancelled')
    await rm(dir, { recursive: true, force: true })
  })
})
