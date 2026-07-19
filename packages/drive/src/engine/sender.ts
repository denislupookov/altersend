import type { ChunkReader, DriveChannel, ControlMessage } from './types'
import { selectChunkSize, chunkCount, chunkRange } from './chunker'
import { hashChunk, createFileHasher } from './hash'
import { PEER_SILENCE_TIMEOUT_MS } from './errors'
import { Timeout } from './timeout'

interface CancelOptions {
  notifyPeer?: boolean
}

export interface SenderOptions {
  transferId: string
  name: string
  highWaterMark?: number
  ackTimeoutMs?: number
  onProgress?: (sentBytes: number, totalBytes: number) => void
}

const DEFAULT_HIGH_WATER = 8 * 1024 * 1024

export class SenderSession {
  private readonly reader: ChunkReader
  private readonly channel: DriveChannel
  private readonly opts: SenderOptions
  private readonly highWater: number
  private readonly chunkHashes = new Map<number, string>()
  private readonly done: Promise<string>

  private size = 0
  private chunkSize = 0
  private totalChunks = 0
  private started = false
  private announced = false
  private sending = false
  private settled = false
  private readonly ackTimeout: Timeout
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
    const ackMs = opts.ackTimeoutMs ?? PEER_SILENCE_TIMEOUT_MS
    this.ackTimeout = new Timeout(ackMs, () =>
      this.fail(new Error(`Receiver did not acknowledge within ${ackMs}ms`), { notifyPeer: false })
    )
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

      if (this.settled) return this.done

      this.channel.send({
        type: 'start',
        transferId: this.opts.transferId,
        name: this.opts.name,
        size: this.size,
        chunkSize: this.chunkSize
      })
      this.announced = true
    } catch (err) {
      this.fail(err instanceof Error ? err : new Error(String(err)))
    }

    return this.done
  }

  private onMessage(message: ControlMessage): void {
    if (message.transferId !== this.opts.transferId) return
    switch (message.type) {
      case 'need':
        if (!this.announced) break
        this.sendChunks(message.indices).catch((err) => this.fail(err))
        break
      case 'ack':
        if (this.settled) break
        this.settled = true
        this.ackTimeout.stop()
        this.settle.resolve(message.savedTo)
        break
      case 'cancel':
        this.fail(new Error(message.reason ?? 'Transfer cancelled by receiver'), {
          notifyPeer: false
        })
        break
    }
  }

  private hasValidIndices(indices: number[]): boolean {
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
    try {
      if (!this.hasValidIndices(indices)) {
        this.fail(new Error('Rejected invalid chunk request'))
        return
      }

      let sentBytes = 0
      for (const index of indices) {
        if (this.settled) return
        const { offset, length } = chunkRange(index, this.size, this.chunkSize)
        const data = await this.reader.read(offset, length)
        const hash = hashChunk(data)
        this.chunkHashes.set(index, hash)

        await this.drain()
        if (this.settled) return
        this.channel.sendChunk({ transferId: this.opts.transferId, index, hash }, data)

        sentBytes += data.length
        this.opts.onProgress?.(sentBytes, this.size)
      }

      if (this.settled) return
      const fileHash = await this.computeFileHash()
      if (this.settled) return
      this.channel.send({
        type: 'complete',
        transferId: this.opts.transferId,
        fileHash
      })
      this.ackTimeout.start()
    } finally {
      this.sending = false
    }
  }

  private async computeFileHash(): Promise<string> {
    const root = createFileHasher()
    for (let i = 0; i < this.totalChunks; i++) {
      if (this.settled) throw new Error('Transfer cancelled')
      const cached = this.chunkHashes.get(i)
      if (cached) {
        root.add(cached)
        continue
      }
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

  cancel(reason = 'Transfer cancelled', options: CancelOptions = {}): void {
    this.fail(new Error(reason), options)
  }

  private fail(err: Error, { notifyPeer = true }: CancelOptions = {}): void {
    if (this.settled) return
    this.settled = true
    this.ackTimeout.stop()
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
