import { basename, join } from 'node:path'
import type { DriveChannel } from '../engine/types'
import type { Bitmap } from '../engine/bitmap'
import { SenderSession } from '../engine/sender'
import { ReceiverSession } from '../engine/receiver'
import { DiskReader } from '../adapters/disk-reader'
import { DiskWriter } from '../adapters/disk-writer'

export interface SendFileOptions {
  transferId?: string
  name?: string
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
  try {
    return await sender.start()
  } finally {
    await reader.close()
  }
}

export interface ReceiveFileOptions {
  transferId?: string
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
    resumeBits: opts.resumeBits,
    verifyFullFile: opts.verifyFullFile,
    onProgress: opts.onProgress,
    onChunkWritten: opts.onChunkWritten
  })
  return receiver.receive()
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
