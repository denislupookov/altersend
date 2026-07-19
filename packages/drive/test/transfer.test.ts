import { describe, it, expect, afterEach } from 'vitest'
import { mkdtemp, writeFile, readFile, rm, stat } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { SenderSession } from '../src/engine/sender'
import { ReceiverSession } from '../src/engine/receiver'
import { DiskReader } from '../src/adapters/disk-reader'
import { DiskWriter, discardPartial } from '../src/adapters/disk-writer'
import { createChannelPair } from './support'

let dir = ''

afterEach(async () => {
  if (dir) await rm(dir, { recursive: true, force: true })
})

describe('end-to-end transfer', () => {
  it('delivers a file byte-for-byte through the real adapters', async () => {
    dir = await mkdtemp(join(tmpdir(), 'drive-e2e-'))
    const src = join(dir, 'input.bin')
    const dst = join(dir, 'output.bin')

    const input = new Uint8Array(1024 * 1024)
    for (let i = 0; i < input.length; i++) input[i] = (i * 131 + 7) & 0xff
    await writeFile(src, input)

    const [senderChannel, receiverChannel] = createChannelPair()
    const receiver = new ReceiverSession(new DiskWriter(dst), receiverChannel, {
      transferId: 'e2e'
    })
    const sender = new SenderSession(new DiskReader(src), senderChannel, {
      transferId: 'e2e',
      name: 'output.bin'
    })

    const [savedTo] = await Promise.all([receiver.receive(), sender.start()])
    await sender.close()

    expect(savedTo).toBe(dst)
    const output = new Uint8Array(await readFile(dst))
    expect(Buffer.from(output).equals(Buffer.from(input))).toBe(true)
    await expect(stat(`${dst}.part`)).rejects.toThrow()
  })
})

describe('expectedSize', () => {
  it('rejects a sender that announces a different size than offered', async () => {
    dir = await mkdtemp(join(tmpdir(), 'drive-size-'))
    const src = join(dir, 'input.bin')
    const dst = join(dir, 'output.bin')
    await writeFile(src, new Uint8Array(4096))

    const [senderChannel, receiverChannel] = createChannelPair()
    const receiver = new ReceiverSession(new DiskWriter(dst), receiverChannel, {
      transferId: 's1',
      expectedSize: 9999
    })
    const sender = new SenderSession(new DiskReader(src), senderChannel, {
      transferId: 's1',
      name: 'output.bin'
    })

    const results = await Promise.allSettled([receiver.receive(), sender.start()])
    await sender.close()

    expect(results[0].status).toBe('rejected')
    expect((results[0] as PromiseRejectedResult).reason.message).toContain('expected 9999')
    await expect(stat(dst)).rejects.toThrow()
  })
})

describe('cancel', () => {
  it('stops the sender mid-flight and keeps the partial for resuming', async () => {
    dir = await mkdtemp(join(tmpdir(), 'drive-cancel-'))
    const src = join(dir, 'input.bin')
    const dst = join(dir, 'output.bin')
    await writeFile(src, new Uint8Array(4 * 1024 * 1024))

    const [senderChannel, receiverChannel] = createChannelPair()
    const receiver = new ReceiverSession(new DiskWriter(dst), receiverChannel, { transferId: 'c1' })
    const sender = new SenderSession(new DiskReader(src), senderChannel, {
      transferId: 'c1',
      name: 'output.bin'
    })

    const sent: number[] = []
    const originalSendChunk = senderChannel.sendChunk.bind(senderChannel)
    senderChannel.sendChunk = (header, data) => {
      sent.push(header.index)
      if (sent.length === 2) receiver.cancel('user cancelled')
      originalSendChunk(header, data)
    }

    const results = await Promise.allSettled([receiver.receive(), sender.start()])
    await new Promise((resolve) => setTimeout(resolve, 100))
    await sender.close()

    expect(results[0].status).toBe('rejected')
    expect(results[1].status).toBe('rejected')
    expect(sent.length).toBeLessThan(16)
    await expect(stat(dst)).rejects.toThrow()
    expect((await stat(`${dst}.part`)).size).toBeGreaterThan(0)

    await discardPartial(dst)
    await expect(stat(`${dst}.part`)).rejects.toThrow()
  })

  it('rejects the sender when the receiver cancels', async () => {
    dir = await mkdtemp(join(tmpdir(), 'drive-cancel2-'))
    const src = join(dir, 'input.bin')
    await writeFile(src, new Uint8Array(64))

    const [senderChannel, receiverChannel] = createChannelPair()
    const receiver = new ReceiverSession(new DiskWriter(join(dir, 'out.bin')), receiverChannel, {
      transferId: 'c2'
    })
    const sender = new SenderSession(new DiskReader(src), senderChannel, {
      transferId: 'c2',
      name: 'out.bin'
    })

    receiver.cancel('nope')
    const results = await Promise.allSettled([receiver.receive(), sender.start()])
    await sender.close()

    expect(results[0].status).toBe('rejected')
    expect(results[1].status).toBe('rejected')
    await expect(stat(join(dir, 'out.bin'))).rejects.toThrow()
  })
})

describe('unreadable source', () => {
  it('cancels the receiver instead of leaving it waiting', async () => {
    dir = await mkdtemp(join(tmpdir(), 'drive-missing-'))
    const dst = join(dir, 'out.bin')

    const [senderChannel, receiverChannel] = createChannelPair()
    const receiver = new ReceiverSession(new DiskWriter(dst), receiverChannel, { transferId: 'm1' })
    const sender = new SenderSession(new DiskReader(join(dir, 'gone.bin')), senderChannel, {
      transferId: 'm1',
      name: 'out.bin'
    })

    const results = await Promise.allSettled([receiver.receive(), sender.start()])

    expect(results[1].status).toBe('rejected')
    expect(results[0].status).toBe('rejected')
    await expect(stat(dst)).rejects.toThrow()
  })
})

describe('finalize safety', () => {
  it('never overwrites a file that appeared at the target during the transfer', async () => {
    dir = await mkdtemp(join(tmpdir(), 'drive-clobber-'))
    const src = join(dir, 'input.bin')
    const dst = join(dir, 'output.bin')
    const input = new Uint8Array(4096).fill(3)
    await writeFile(src, input)

    const [senderChannel, receiverChannel] = createChannelPair()
    const receiver = new ReceiverSession(new DiskWriter(dst), receiverChannel, { transferId: 'x1' })
    const sender = new SenderSession(new DiskReader(src), senderChannel, {
      transferId: 'x1',
      name: 'output.bin'
    })

    await writeFile(dst, 'a file the user created meanwhile')

    const [savedTo] = await Promise.all([receiver.receive(), sender.start()])
    await sender.close()

    expect(savedTo).not.toBe(dst)
    expect(await readFile(dst, 'utf8')).toBe('a file the user created meanwhile')
    expect(Buffer.from(await readFile(savedTo)).equals(Buffer.from(input))).toBe(true)
  })
})
