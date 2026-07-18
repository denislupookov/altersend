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
  private settled = false
  private settle!: { resolve: (savedTo: string) => void; reject: (err: Error) => void }

  constructor(reader: ChunkReader, channel: DriveChannel, opts: SenderOptions) {
    this.reader = reader
    this.channel = channel
    this.opts = opts
    this.highWater = opts.highWaterMark ?? DEFAULT_HIGH_WATER
    if (!Number.isFinite(this.highWater) || this.highWater < 0) {
      throw new RangeError('highWaterMark must be a finite non-negative number')
    }
    this.done = new Promise<string>((resolve, reject) => {
      this.settle = { resolve, reject }
    })
    this.done.catch(() => {})
    this.channel.onMessage((message) => this.onMessage(message))
  }

  async start(): Promise<string> {
    if (this.started) throw new Error('SenderSession already started')
    this.started = true

    try {
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
    } catch (err) {
      this.fail(err instanceof Error ? err : new Error(String(err)))
    }

    return this.done
  }

  private onMessage(message: ControlMessage): void {
    if (message.transferId !== this.opts.transferId) return
    switch (message.type) {
      case 'need':
        this.sendChunks(message.indices).catch((err) => this.fail(err))
        break
      case 'ack':
        if (this.settled) break
        this.settled = true
        this.settle.resolve(message.savedTo)
        break
      case 'cancel':
        this.fail(new Error(message.reason ?? 'Transfer cancelled by receiver'), false)
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
      this.fail(new Error('Rejected invalid chunk request'))
      return
    }

    const inOrderFull = indices.length === this.totalChunks && indices.every((idx, i) => idx === i)
    const root = inOrderFull ? createFileHasher() : null

    let sentBytes = 0
    for (const index of indices) {
      if (this.settled) return
      const { offset, length } = chunkRange(index, this.size, this.chunkSize)
      const data = await this.reader.read(offset, length)
      const hash = hashChunk(data)
      root?.add(hash)

      await this.drain()
      this.channel.sendChunk({ transferId: this.opts.transferId, index, hash }, data)

      sentBytes += data.length
      this.opts.onProgress?.(sentBytes, this.size)
    }

    if (this.settled) return
    const fileHash = root ? root.digest() : await this.fileRoot()
    if (this.settled) return
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
    while (!this.settled && this.channel.bufferedAmount() > this.highWater) {
      await new Promise((resolve) => setTimeout(resolve, 1))
    }
  }

  cancel(reason = 'Transfer cancelled'): void {
    this.fail(new Error(reason))
  }

  private fail(err: Error, notifyPeer = true): void {
    if (this.settled) return
    this.settled = true
    if (notifyPeer) {
      try {
        this.channel.send({ type: 'cancel', transferId: this.opts.transferId })
      } catch {}
    }
    this.settle.reject(err)
  }

  async close(): Promise<void> {
    await this.reader.close()
  }
}
