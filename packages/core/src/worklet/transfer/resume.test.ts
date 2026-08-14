import { describe, it, expect, afterEach } from 'vitest'
import { mkdtemp, writeFile, readFile, rm, stat } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import SecretStream from '@hyperswarm/secret-stream'
import { Duplex } from 'streamx'
import type { PeerSocket } from 'hyperswarm'
import { PeerDrive } from './drive'
import { TransferReceiver } from './receiver'
import type { DownloaderCallbacks, DownloadLifecycleEvent } from './download-events'
import type { DownloadFileRequest } from '../rpc/protocol'

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

function collect(): { callbacks: DownloaderCallbacks; errors: DownloadLifecycleEvent[] } {
  const errors: DownloadLifecycleEvent[] = []
  return {
    errors,
    callbacks: {
      onFileStart: () => {},
      onFileProgress: () => {},
      onFileComplete: () => {},
      onFileError: (event) => errors.push(event)
    }
  }
}

let dir = ''

afterEach(async () => {
  if (dir) await rm(dir, { recursive: true, force: true })
  dir = ''
})

describe('drive resume through TransferReceiver', () => {
  it('resumes a dropped download and sends only the missing chunks', async () => {
    dir = await mkdtemp(join(tmpdir(), 'core-resume-'))
    const src = join(dir, 'in.bin')
    const input = new Uint8Array(8 * 1024 * 1024)
    for (let i = 0; i < input.length; i++) input[i] = (i * 31 + 11) & 0xff
    await writeFile(src, input)

    const request: DownloadFileRequest = {
      transferId: 't1',
      fileId: 'f1',
      path: '/in.bin',
      name: 'in.bin',
      size: input.length,
      targetPath: join(dir, 'out.bin')
    }

    const receiver = new TransferReceiver()

    const attempt = async (abortAfterFirstChunk: boolean) => {
      const [socketA, socketB] = socketPair()
      const senderSide = PeerDrive.create(socketA)!
      const receiverSide = PeerDrive.create(socketB)!
      await senderSide.supported

      const controller = new AbortController()
      const { callbacks, errors } = collect()
      let receivedBytes = 0
      callbacks.onFileStart = () => {
        senderSide
          .serve(request.fileId, 'in.bin', src)
          .catch((err) => console.error('test setup failed', err))
      }
      callbacks.onFileProgress = (event) => {
        receivedBytes = event.bytesTransferred ?? 0
        if (abortAfterFirstChunk) controller.abort()
      }

      const [result] = await receiver.downloadFiles(
        [request],
        callbacks,
        async () => receiverSide.session(request.fileId),
        controller.signal
      )
      return { result, errors, receivedBytes }
    }

    const dst = join(dir, 'out.bin')

    const first = await attempt(true)
    expect(first.result.ok).toBe(false)
    expect(first.errors[0]?.resumable).toBe(true)
    expect((await stat(`${dst}.part`)).size).toBe(input.length)
    expect(first.receivedBytes).toBeGreaterThan(0)
    expect(first.receivedBytes).toBeLessThan(input.length)

    const second = await attempt(false)
    expect(second.result.ok).toBe(true)
    expect(second.receivedBytes).toBe(input.length)
    expect(Buffer.from(await readFile(dst)).equals(Buffer.from(input))).toBe(true)
    await expect(stat(`${dst}.part`)).rejects.toThrow()
  })
})

describe('pausing one download', () => {
  it('stops the file mid-flight, keeps it resumable, and finishes on resume', async () => {
    dir = await mkdtemp(join(tmpdir(), 'core-pause-'))
    const src = join(dir, 'in.bin')
    const input = new Uint8Array(16 * 1024 * 1024)
    for (let i = 0; i < input.length; i++) input[i] = (i * 17 + 5) & 0xff
    await writeFile(src, input)

    const dst = join(dir, 'out.bin')
    const request: DownloadFileRequest = {
      transferId: 't1',
      fileId: 'f1',
      path: '/in.bin',
      name: 'in.bin',
      size: input.length,
      targetPath: dst
    }

    const receiver = new TransferReceiver()

    const run = async (pauseOnFirstChunk: boolean) => {
      const [socketA, socketB] = socketPair()
      const senderSide = PeerDrive.create(socketA)!
      const receiverSide = PeerDrive.create(socketB)!
      await senderSide.supported

      const { callbacks, errors } = collect()
      callbacks.onFileStart = () => {
        senderSide
          .serve(request.fileId, 'in.bin', src)
          .catch((err) => console.error('test setup failed', err))
      }
      if (pauseOnFirstChunk) {
        callbacks.onFileProgress = () => receiver.pause(request.fileId)
      }

      const [result] = await receiver.downloadFiles([request], callbacks, async () =>
        receiverSide.session(request.fileId)
      )
      return { result, errors }
    }

    const paused = await run(true)
    expect(paused.result.ok).toBe(false)
    expect(paused.errors[0]?.resumable).toBe(true)
    expect((await stat(`${dst}.part`)).size).toBe(input.length)
    await expect(stat(dst)).rejects.toThrow()

    const resumed = await run(false)
    expect(resumed.result.ok).toBe(true)
    expect(Buffer.from(await readFile(dst)).equals(Buffer.from(input))).toBe(true)
  })
})

describe('command scheduling', () => {
  it('lets pause run without waiting, and queues transfers separately', async () => {
    const { runsWithoutWaiting, isFileTransfer } = await import('../rpc/server')

    expect(isFileTransfer('downloadFiles')).toBe(true)

    for (const method of ['pauseDownload', 'inviteDevice', 'respondToInvite'] as const) {
      expect(runsWithoutWaiting(method)).toBe(true)
    }

    for (const method of ['shareFiles', 'disconnect', 'closePeers', 'peersList'] as const) {
      expect(runsWithoutWaiting(method)).toBe(false)
      expect(isFileTransfer(method)).toBe(false)
    }
  })
})

describe('target naming', () => {
  const download = async (
    receiver: TransferReceiver,
    request: DownloadFileRequest,
    src: string
  ) => {
    const [socketA, socketB] = socketPair()
    const senderSide = PeerDrive.create(socketA)!
    const receiverSide = PeerDrive.create(socketB)!
    await senderSide.supported

    const { callbacks } = collect()
    callbacks.onFileStart = () => {
      senderSide
        .serve(request.fileId, 'in.bin', src)
        .catch((err) => console.error('test setup failed', err))
    }
    const [result] = await receiver.downloadFiles([request], callbacks, async () =>
      receiverSide.session(request.fileId)
    )
    return result
  }

  const baseRequest = (dst: string): DownloadFileRequest => ({
    transferId: 't1',
    fileId: 'f1',
    path: '/in.bin',
    name: 'in.bin',
    size: 64,
    targetPath: dst
  })

  it('recycles an orphaned .part instead of shifting the name forever', async () => {
    dir = await mkdtemp(join(tmpdir(), 'core-orphan-'))
    const src = join(dir, 'in.bin')
    await writeFile(src, new Uint8Array(64).fill(6))
    const dst = join(dir, 'out.bin')
    await writeFile(`${dst}.part`, new Uint8Array(999))

    const result = await download(new TransferReceiver(), baseRequest(dst), src)
    expect(result.ok).toBe(true)
    expect(result.savedTo).toBe(dst)
    expect(Buffer.from(await readFile(dst))).toEqual(Buffer.from(new Uint8Array(64).fill(6)))
    await expect(stat(`${dst}.part`)).rejects.toThrow()
  })

  it('still steps aside for a real file that already exists', async () => {
    dir = await mkdtemp(join(tmpdir(), 'core-exists-'))
    const src = join(dir, 'in.bin')
    await writeFile(src, new Uint8Array(64).fill(7))
    const dst = join(dir, 'out.bin')
    await writeFile(dst, 'PRE-EXISTING')

    const result = await download(new TransferReceiver(), baseRequest(dst), src)
    expect(result.ok).toBe(true)
    expect(result.savedTo).toBe(join(dir, 'out (1).bin'))
    expect(await readFile(dst, 'utf8')).toBe('PRE-EXISTING')
  })
})

describe('pausing a file that has not started yet', () => {
  it('stops it from starting instead of skipping to it', async () => {
    dir = await mkdtemp(join(tmpdir(), 'core-queued-'))
    const src = join(dir, 'in.bin')
    await writeFile(src, new Uint8Array(4 * 1024 * 1024).fill(9))

    const make = (id: string): DownloadFileRequest => ({
      transferId: 't1',
      fileId: id,
      path: '/in.bin',
      name: `${id}.bin`,
      size: 4 * 1024 * 1024,
      targetPath: join(dir, `${id}.bin`)
    })

    const [socketA, socketB] = socketPair()
    const senderSide = PeerDrive.create(socketA)!
    const receiverSide = PeerDrive.create(socketB)!
    await senderSide.supported

    const receiver = new TransferReceiver()
    const started: string[] = []
    const { callbacks } = collect()
    callbacks.onFileStart = (event) => {
      started.push(event.fileId)
      senderSide
        .serve(event.fileId, `${event.fileId}.bin`, src)
        .catch((err) => console.error('test setup failed', err))
    }
    callbacks.onFileProgress = (event) => {
      if (event.fileId === 'f1') expect(receiver.pause('f2')).toBe(true)
    }

    const results = await receiver.downloadFiles(
      [make('f1'), make('f2')],
      callbacks,
      async (file) => receiverSide.session(file.fileId)
    )

    expect(started).toEqual(['f1'])
    expect(results[0].ok).toBe(true)
    expect(results[1].ok).toBe(false)
    expect(results[1].message).toBe('Cancelled')
  })
})
