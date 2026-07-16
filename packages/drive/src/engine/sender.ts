import type { ChunkReader, DriveChannel, ControlMessage } from './types'
import { selectChunkSize, chunkCount, chunkRange } from './chunker'
import { hashChunk, createFileHasher } from './hash'

export interface SenderOptions {
  transferId: string
  name: string
  highWaterMark?: number
  onProgress?: (sentBytes: number, totalBytes: number) => void
}

const DEFAULT_HIGH_WATER = 8 * 1024 * 1024

export class SenderSession {
  private readonly reader: ChunkReader
  private readonly channel: DriveChannel
  private readonly opts: SenderOptions
  private readonly highWater: number
  private readonly done: Promise<string>

  private size = 0
  private chunkSize = 0
  private totalChunks = 0
  private started = false
  private sending = false
  private settle!: { resolve: (savedTo: string) => void; reject: (err: Error) => void }

  constructor(reader: ChunkReader, channel: DriveChannel, opts: SenderOptions) {
    this.reader = reader
    this.channel = channel
    this.opts = opts
    this.highWater = opts.highWaterMark ?? DEFAULT_HIGH_WATER
    this.done = new Promise<string>((resolve, reject) => {
      this.settle = { resolve, reject }
    })
    this.channel.onMessage((message) => this.onMessage(message))
  }

  async start(): Promise<string> {
    if (this.started) throw new Error('SenderSession already started')
    this.started = true

    this.size = await this.reader.size()
    this.chunkSize = selectChunkSize(this.size)
    this.totalChunks = chunkCount(this.size, this.chunkSize)

    this.channel.send({
      type: 'start',
      transferId: this.opts.transferId,
      name: this.opts.name,
      size: this.size,
      chunkSize: this.chunkSize
    })

    return this.done
  }

  private onMessage(message: ControlMessage): void {
    if (message.transferId !== this.opts.transferId) return
    switch (message.type) {
      case 'need':
        this.sendChunks(message.indices).catch((err) => this.fail(err))
        break
      case 'ack':
        this.settle.resolve(message.savedTo)
        break
      case 'cancel':
        this.fail(new Error(message.reason ?? 'Transfer cancelled by receiver'))
        break
    }
  }

  private validIndices(indices: number[]): boolean {
    const seen = new Set<number>()
    for (const index of indices) {
      if (!Number.isInteger(index) || index < 0 || index >= this.totalChunks) return false
      if (seen.has(index)) return false
      seen.add(index)
    }
    return true
  }

  private async sendChunks(indices: number[]): Promise<void> {
    if (this.sending) return
    this.sending = true

    if (!this.validIndices(indices)) {
      this.channel.send({
        type: 'cancel',
        transferId: this.opts.transferId,
        reason: 'Rejected chunk request'
      })
      this.fail(new Error('Rejected invalid chunk request'))
      return
    }

    const inOrderFull =
      indices.length === this.totalChunks && indices.every((idx, i) => idx === i)
    const root = inOrderFull ? createFileHasher() : null

    let sentBytes = 0
    for (const index of indices) {
      const { offset, length } = chunkRange(index, this.size, this.chunkSize)
      const data = await this.reader.read(offset, length)
      const hash = hashChunk(data)
      root?.add(hash)

      await this.drain()
      this.channel.sendChunk({ transferId: this.opts.transferId, index, hash }, data)

      sentBytes += data.length
      this.opts.onProgress?.(sentBytes, this.size)
    }

    const fileHash = root ? root.digest() : await this.fileRoot()
    this.channel.send({
      type: 'complete',
      transferId: this.opts.transferId,
      fileHash
    })
  }

  private async fileRoot(): Promise<string> {
    const root = createFileHasher()
    for (let i = 0; i < this.totalChunks; i++) {
      const { offset, length } = chunkRange(i, this.size, this.chunkSize)
      root.add(hashChunk(await this.reader.read(offset, length)))
    }
    return root.digest()
  }

  private async drain(): Promise<void> {
    while (this.channel.bufferedAmount() > this.highWater) {
      await new Promise((resolve) => setTimeout(resolve, 1))
    }
  }

  private fail(err: Error): void {
    this.settle.reject(err)
  }

  async close(): Promise<void> {
    await this.reader.close()
  }
}
