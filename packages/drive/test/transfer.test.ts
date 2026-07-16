import { describe, it, expect, afterEach } from 'vitest'
import { mkdtemp, writeFile, readFile, rm, stat } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { SenderSession } from '../src/engine/sender'
import { ReceiverSession } from '../src/engine/receiver'
import { DiskReader } from '../src/adapters/disk-reader'
import { DiskWriter } from '../src/adapters/disk-writer'
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
    const receiver = new ReceiverSession(new DiskWriter(dst), receiverChannel, { transferId: 'e2e' })
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
