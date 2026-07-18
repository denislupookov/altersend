import type { ChunkWriter, DriveChannel, ChunkHeader, ControlMessage } from './types'
import { selectChunkSize, chunkCount, chunkRange } from './chunker'
import { hashChunk, createFileHasher } from './hash'
import { Bitmap } from './bitmap'

export interface ReceiverOptions {
  transferId?: string
  expectedSize?: number
  resumeBits?: Uint8Array
  verifyFullFile?: boolean
  onProgress?: (receivedBytes: number, totalBytes: number) => void
  onChunkWritten?: (bitmap: Bitmap) => void
}

export class ReceiverSession {
  private readonly writer: ChunkWriter
  private readonly channel: DriveChannel
  private readonly opts: ReceiverOptions

  private size = 0
  private chunkSize = 0
  private bitmap: Bitmap | null = null
  private receivedBytes = 0
  private resumed = false
  private transferId: string | null
  private settled = false
  private settle!: { resolve: (savedTo: string) => void; reject: (err: Error) => void }
  private readonly done: Promise<string>
  private tail: Promise<void> = Promise.resolve()

  constructor(writer: ChunkWriter, channel: DriveChannel, opts: ReceiverOptions) {
    this.writer = writer
    this.channel = channel
    this.opts = opts
    this.transferId = opts.transferId ?? null
    this.done = new Promise<string>((resolve, reject) => {
      this.settle = { resolve, reject }
    })
    this.done.catch(() => {})
    this.channel.onMessage((message) => this.onMessage(message))
    this.channel.onChunk((header, data) => this.enqueue(() => this.onChunk(header, data)))
  }

  private enqueue(task: () => Promise<void>): void {
    this.tail = this.tail.then(task).catch((err) => this.fail(err))
  }

  receive(): Promise<string> {
    return this.done
  }

  get received(): Bitmap | null {
    return this.bitmap
  }

  private onMessage(message: ControlMessage): void {
    if (message.type === 'start') {
      if (this.transferId === null) this.transferId = message.transferId
      else if (message.transferId !== this.transferId) return
      this.enqueue(() => this.onStart(message.size, message.chunkSize))
      return
    }
    if (this.transferId === null || message.transferId !== this.transferId) return
    switch (message.type) {
      case 'complete':
        this.enqueue(() => this.onComplete(message.fileHash))
        break
      case 'cancel':
        this.enqueue(() =>
          this.fail(new Error(message.reason ?? 'Transfer cancelled by sender'), false)
        )
        break
    }
  }

  private validGeometry(size: number, chunkSize: number): boolean {
    return Number.isSafeInteger(size) && size >= 0 && chunkSize === selectChunkSize(size)
  }

  private async onStart(size: number, chunkSize: number): Promise<void> {
    if (this.settled) return
    if (!this.validGeometry(size, chunkSize)) {
      throw new Error(`Rejected transfer geometry: size=${size} chunkSize=${chunkSize}`)
    }
    const expected = this.opts.expectedSize
    if (expected !== undefined && size !== expected) {
      throw new Error(`Sender announced ${size} bytes, expected ${expected}`)
    }
    this.size = size
    this.chunkSize = chunkSize
    const total = chunkCount(size, chunkSize)
    this.bitmap = this.opts.resumeBits
      ? Bitmap.deserialize(total, this.opts.resumeBits)
      : new Bitmap(total)
    this.resumed = this.bitmap.count() > 0

    for (let i = 0; i < total; i++) {
      if (this.bitmap.get(i)) this.receivedBytes += chunkRange(i, size, chunkSize).length
    }

    await this.writer.allocate(size)
    this.channel.send({
      type: 'need',
      transferId: this.transferId!,
      indices: this.bitmap.missing()
    })
  }

  private async onChunk(header: ChunkHeader, data: Uint8Array): Promise<void> {
    if (this.settled) return
    if (header.transferId !== this.transferId) return
    const bitmap = this.bitmap
    if (!bitmap) throw new Error('Received chunk before start')
    if (!Number.isInteger(header.index) || header.index < 0 || header.index >= bitmap.size) {
      throw new Error(`Chunk index ${header.index} out of range`)
    }
    if (bitmap.get(header.index)) return

    const { offset, length } = chunkRange(header.index, this.size, this.chunkSize)
    if (data.length !== length) {
      throw new Error(`Chunk ${header.index} length ${data.length}, expected ${length}`)
    }
    if (hashChunk(data) !== header.hash) {
      throw new Error(`Chunk ${header.index} failed hash verification`)
    }

    await this.writer.write(offset, data)
    bitmap.set(header.index)
    this.receivedBytes += length
    this.opts.onChunkWritten?.(bitmap)
    this.opts.onProgress?.(this.receivedBytes, this.size)
  }

  private async onComplete(fileHash: string | null): Promise<void> {
    if (this.settled) return
    const bitmap = this.bitmap
    if (!bitmap) throw new Error('Received complete before start')
    if (!bitmap.allSet()) {
      throw new Error(`Transfer incomplete: ${bitmap.count()}/${bitmap.size} chunks`)
    }

    if (this.opts.verifyFullFile || this.resumed) {
      if (!fileHash) throw new Error('Missing file hash: cannot verify the assembled file')
      await this.verifyFullFile(fileHash)
    }

    const savedTo = await this.writer.finalize()
    this.settled = true
    try {
      this.channel.send({ type: 'ack', transferId: this.transferId!, savedTo })
    } catch {}
    this.settle.resolve(savedTo)
  }

  private async verifyFullFile(expected: string): Promise<void> {
    const root = createFileHasher()
    const total = chunkCount(this.size, this.chunkSize)
    for (let i = 0; i < total; i++) {
      const { offset, length } = chunkRange(i, this.size, this.chunkSize)
      const bytes = await this.writer.readBack(offset, length)
      if (!bytes) throw new Error('Full-file verification could not read back file')
      root.add(hashChunk(bytes))
    }
    if (root.digest() !== expected) throw new Error('Full-file hash mismatch')
  }

  cancel(reason = 'Transfer cancelled'): void {
    this.enqueue(() => this.fail(new Error(reason)))
  }

  private async fail(err: Error, notifyPeer = true): Promise<void> {
    if (this.settled) return
    this.settled = true
    if (notifyPeer && this.transferId !== null) {
      try {
        this.channel.send({ type: 'cancel', transferId: this.transferId })
      } catch {}
    }
    try {
      await this.writer.abort()
    } catch {}
    this.settle.reject(err)
  }
}
