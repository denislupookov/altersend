import { describe, it, expect, afterEach } from 'vitest'
import { mkdtemp, writeFile, readFile, rm, stat } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { sendFile, receiveFile, Drive } from './drive'
import { createChannelPair } from '../../test/support'

let dir: string | null = null

afterEach(async () => {
  if (dir) {
    await rm(dir, { recursive: true, force: true })
    dir = null
  }
})

describe('sendFile / receiveFile end-to-end', () => {
  it('transfers a real file with no leftover .part', async () => {
    dir = await mkdtemp(join(tmpdir(), 'drive-'))
    const srcPath = join(dir, 'source.bin')
    const dstPath = join(dir, 'dest.bin')

    const input = new Uint8Array(600 * 1024)
    for (let i = 0; i < input.length; i++) input[i] = (i * 31 + 7) & 0xff
    await writeFile(srcPath, input)

    const [senderChannel, receiverChannel] = createChannelPair()
    const [savedTo] = await Promise.all([
      receiveFile(dstPath, receiverChannel, { transferId: 't' }),
      sendFile(srcPath, senderChannel, { transferId: 't' })
    ])

    expect(savedTo).toBe(dstPath)
    const out = new Uint8Array(await readFile(dstPath))
    expect(Buffer.from(out).equals(Buffer.from(input))).toBe(true)
    await expect(stat(`${dstPath}.part`)).rejects.toThrow()
  })

  it('defaults the sent name to the file basename', async () => {
    dir = await mkdtemp(join(tmpdir(), 'drive-'))
    const srcPath = join(dir, 'photo.jpg')
    const dstPath = join(dir, 'received.jpg')
    await writeFile(srcPath, new Uint8Array([1, 2, 3, 4, 5]))

    const [senderChannel, receiverChannel] = createChannelPair()
    let seenName = ''
    const forward = senderChannel.send.bind(senderChannel)
    senderChannel.send = (m) => {
      if (m.type === 'start') seenName = m.name
      forward(m)
    }

    await Promise.all([
      receiveFile(dstPath, receiverChannel, { transferId: 't' }),
      sendFile(srcPath, senderChannel, { transferId: 't' })
    ])

    expect(seenName).toBe('photo.jpg')
  })

  it('works with no transferId — receiver adopts the sender-generated id', async () => {
    dir = await mkdtemp(join(tmpdir(), 'drive-'))
    const srcPath = join(dir, 'source.bin')
    const dstPath = join(dir, 'dest.bin')
    const input = new Uint8Array(200 * 1024).map((_, i) => (i * 13) & 0xff)
    await writeFile(srcPath, input)

    const [senderChannel, receiverChannel] = createChannelPair()
    const [savedTo] = await Promise.all([
      receiveFile(dstPath, receiverChannel),
      sendFile(srcPath, senderChannel)
    ])

    expect(savedTo).toBe(dstPath)
    expect(Buffer.from(await readFile(dstPath)).equals(Buffer.from(input))).toBe(true)
  })
})

describe('Drive (rooted helper)', () => {
  it('receives by name under the configured root', async () => {
    dir = await mkdtemp(join(tmpdir(), 'drive-'))
    const srcPath = join(dir, 'source.bin')
    const input = new Uint8Array(200 * 1024).map((_, i) => (i * 17 + 3) & 0xff)
    await writeFile(srcPath, input)

    const drive = new Drive(dir)
    const [senderChannel, receiverChannel] = createChannelPair()
    const [savedTo] = await Promise.all([
      drive.receive('received.bin', receiverChannel),
      drive.send(srcPath, senderChannel)
    ])

    expect(savedTo).toBe(join(dir, 'received.bin'))
    expect(Buffer.from(await readFile(savedTo)).equals(Buffer.from(input))).toBe(true)
  })
})
