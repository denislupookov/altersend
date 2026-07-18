import { describe, it, expect, afterEach } from 'vitest'
import { mkdtemp, writeFile, readFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import SecretStream from '@hyperswarm/secret-stream'
import Protomux from 'protomux'
import { Duplex } from 'streamx'
import { SenderSession, ReceiverSession, DiskReader, DiskWriter } from '@altersend/drive'
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

function payload(size: number): Uint8Array {
  const bytes = new Uint8Array(size)
  for (let i = 0; i < size; i++) bytes[i] = (i * 31 + 11) & 0xff
  return bytes
}

let dir = ''

async function sourceFile(name: string, size: number): Promise<[string, Uint8Array]> {
  if (!dir) dir = await mkdtemp(join(tmpdir(), 'peerdrive-'))
  const path = join(dir, name)
  const bytes = payload(size)
  await writeFile(path, bytes)
  return [path, bytes]
}

afterEach(async () => {
  if (dir) await rm(dir, { recursive: true, force: true })
  dir = ''
})

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

    const [src, input] = await sourceFile('in.bin', 700 * 1024)
    const dst = join(dir, 'out.bin')

    const receiver = new ReceiverSession(new DiskWriter(dst), receiverSide.session('file-1'), {
      transferId: 'file-1'
    })
    const sender = new SenderSession(new DiskReader(src), senderSide.session('file-1'), {
      transferId: 'file-1',
      name: 'out.bin'
    })

    const [savedTo] = await Promise.all([receiver.receive(), sender.start()])

    expect(savedTo).toBe(dst)
    expect(Buffer.from(await readFile(dst)).equals(Buffer.from(input))).toBe(true)
  })

  it('keeps concurrent files on one channel separate', async () => {
    const [socketA, socketB] = socketPair()
    const senderSide = PeerDrive.create(socketA)!
    const receiverSide = PeerDrive.create(socketB)!

    const sources = [await sourceFile('a.bin', 300 * 1024), await sourceFile('b.bin', 120 * 1024)]

    const transfers = sources.map(([src], i) => {
      const id = `file-${i}`
      const dst = join(dir, `out-${i}.bin`)
      const receiver = new ReceiverSession(new DiskWriter(dst), receiverSide.session(id), {
        transferId: id
      })
      const sender = new SenderSession(new DiskReader(src), senderSide.session(id), {
        transferId: id,
        name: `out-${i}.bin`
      })
      return Promise.all([receiver.receive(), sender.start()])
    })

    await Promise.all(transfers)

    for (const [i, [, input]] of sources.entries()) {
      const written = await readFile(join(dir, `out-${i}.bin`))
      expect(Buffer.from(written).equals(Buffer.from(input))).toBe(true)
    }
  })

  it('cancels an in-flight serve() when the drive is destroyed', async () => {
    const [socketA, socketB] = socketPair()
    const senderSide = PeerDrive.create(socketA)!
    PeerDrive.create(socketB)!

    const [src] = await sourceFile('in.bin', 64 * 1024)

    const serving = senderSide.serve('file-x', 'in.bin', src)
    await senderSide.supported

    senderSide.destroy()

    await expect(serving).rejects.toThrow('cancelled')
  })
})
