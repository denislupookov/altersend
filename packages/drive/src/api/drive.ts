import nodePath from '#path'
import type { DriveChannel } from '../engine/types'
import type { Bitmap } from '../engine/bitmap'
import { SenderSession } from '../engine/sender'
import { ReceiverSession } from '../engine/receiver'
import { DiskReader } from '../adapters/disk-reader'
import { DiskWriter } from '../adapters/disk-writer'

const { basename, join } = nodePath

function onAbort(signal: AbortSignal | undefined, cancel: () => void): () => void {
  if (!signal) return () => {}
  if (signal.aborted) {
    cancel()
    return () => {}
  }
  signal.addEventListener('abort', cancel)
  return () => signal.removeEventListener('abort', cancel)
}

export interface SendFileOptions {
  transferId?: string
  name?: string
  signal?: AbortSignal
  highWaterMark?: number
  onProgress?: (sentBytes: number, totalBytes: number) => void
}

export async function sendFile(
  path: string,
  channel: DriveChannel,
  opts: SendFileOptions = {}
): Promise<string> {
  const reader = new DiskReader(path)
  const sender = new SenderSession(reader, channel, {
    transferId: opts.transferId ?? String(Math.random()),
    name: opts.name ?? basename(path),
    highWaterMark: opts.highWaterMark,
    onProgress: opts.onProgress
  })
  const release = onAbort(opts.signal, () => sender.cancel())
  try {
    return await sender.start()
  } finally {
    release()
    await reader.close()
  }
}

export interface ReceiveFileOptions {
  transferId?: string
  expectedSize?: number
  signal?: AbortSignal
  resumeBits?: Uint8Array
  verifyFullFile?: boolean
  onProgress?: (receivedBytes: number, totalBytes: number) => void
  onChunkWritten?: (bitmap: Bitmap) => void
}

export function receiveFile(
  targetPath: string,
  channel: DriveChannel,
  opts: ReceiveFileOptions = {}
): Promise<string> {
  const writer = new DiskWriter(targetPath)
  const receiver = new ReceiverSession(writer, channel, {
    transferId: opts.transferId,
    expectedSize: opts.expectedSize,
    resumeBits: opts.resumeBits,
    verifyFullFile: opts.verifyFullFile,
    onProgress: opts.onProgress,
    onChunkWritten: opts.onChunkWritten
  })
  const release = onAbort(opts.signal, () => receiver.cancel())
  return receiver.receive().finally(release)
}

export class Drive {
  private readonly receiveDir: string

  constructor(receiveDir: string) {
    this.receiveDir = receiveDir
  }

  send(filePath: string, channel: DriveChannel, opts: SendFileOptions = {}): Promise<string> {
    return sendFile(filePath, channel, opts)
  }

  receive(name: string, channel: DriveChannel, opts: ReceiveFileOptions = {}): Promise<string> {
    return receiveFile(join(this.receiveDir, name), channel, opts)
  }
}
