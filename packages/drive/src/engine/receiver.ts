import type { ChunkWriter, DriveChannel, ChunkHeader, ControlMessage } from './types'
import { selectChunkSize, chunkCount, chunkRange } from './chunker'
import { Bitmap } from './bitmap'
import { IntegrityError } from './errors'
import { PEER_SILENCE_TIMEOUT_MS, PROGRESS_INTERVAL_MS, PROGRESS_STEP_BYTES } from './constants'
import { Timeout } from './timeout'

interface CancelOptions {
  notifyPeer?: boolean
}

export interface ReceiverOptions {
  transferId?: string
  expectedSize?: number
  resumeBits?: Uint8Array
  stallTimeoutMs?: number
  progressStepBytes?: number
  progressIntervalMs?: number
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
  private reportedBytes = 0
  private reportedAt = 0
  private transferId: string | null
  private settled = false
  private cancelling = false
  private settle!: { resolve: (savedTo: string) => void; reject: (err: Error) => void }
  private readonly done: Promise<string>
  private tail: Promise<void> = Promise.resolve()
  private readonly silence: Timeout

  constructor(writer: ChunkWriter, channel: DriveChannel, opts: ReceiverOptions) {
    this.writer = writer
    this.channel = channel
    this.opts = opts
    this.transferId = opts.transferId ?? null
    const silenceMs = opts.stallTimeoutMs ?? PEER_SILENCE_TIMEOUT_MS
    this.silence = new Timeout(silenceMs, () =>
      this.enqueue(() => this.fail(new Error(`No data from sender for ${silenceMs}ms`)))
    )
    this.done = new Promise<string>((resolve, reject) => {
      this.settle = { resolve, reject }
    })
    this.done.catch(() => {})
    this.channel.onMessage((message) => {
      this.restartSilenceTimer()
      this.onMessage(message)
    })
    this.channel.onChunk((header, data) => {
      this.restartSilenceTimer()
      this.enqueue(() => this.onChunk(header, data))
    })
    this.restartSilenceTimer()
  }

  private restartSilenceTimer(): void {
    if (this.settled) return
    this.silence.restart()
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
        this.enqueue(() => this.onComplete())
        break
      case 'cancel':
        this.enqueue(() =>
          this.fail(new Error(message.reason ?? 'Transfer cancelled by sender'), {
            notifyPeer: false
          })
        )
        break
    }
  }

  private isValidGeometry(size: number, chunkSize: number): boolean {
    return Number.isSafeInteger(size) && size >= 0 && chunkSize === selectChunkSize(size)
  }

  private async onStart(size: number, chunkSize: number): Promise<void> {
    if (this.settled || this.cancelling) return
    if (!this.isValidGeometry(size, chunkSize)) {
      throw new IntegrityError(`Rejected transfer geometry: size=${size} chunkSize=${chunkSize}`)
    }
    const expected = this.opts.expectedSize
    if (expected !== undefined && size !== expected) {
      throw new IntegrityError(`Sender announced ${size} bytes, expected ${expected}`)
    }
    if (this.bitmap) {
      if (size !== this.size || chunkSize !== this.chunkSize) {
        throw new IntegrityError(`Sender re-announced ${size}/${chunkSize} mid-transfer`)
      }
      this.channel.send({
        type: 'need',
        transferId: this.transferId!,
        indices: this.bitmap.missing()
      })
      return
    }

    this.size = size
    this.chunkSize = chunkSize
    const total = chunkCount(size, chunkSize)
    try {
      this.bitmap = this.opts.resumeBits
        ? Bitmap.deserialize(total, this.opts.resumeBits)
        : new Bitmap(total)
    } catch (err) {
      throw new IntegrityError(
        `Resume state does not match this file: ${err instanceof Error ? err.message : String(err)}`
      )
    }

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
    if (this.settled || this.cancelling) return
    if (header.transferId !== this.transferId) return
    const bitmap = this.bitmap
    if (!bitmap) return
    if (!Number.isInteger(header.index) || header.index < 0 || header.index >= bitmap.size) {
      throw new Error(`Chunk index ${header.index} out of range`)
    }
    if (bitmap.get(header.index)) return

    const { offset, length } = chunkRange(header.index, this.size, this.chunkSize)

    if (data.length !== length) {
      throw new Error(`Chunk ${header.index} length ${data.length}, expected ${length}`)
    }

    await this.writer.write(offset, data)
    bitmap.set(header.index)
    this.receivedBytes += length
    this.opts.onChunkWritten?.(bitmap)
    this.reportProgress(bitmap.allSet())
  }

  private reportProgress(force: boolean): void {
    if (!force && this.receivedBytes === this.reportedBytes) return

    const step = this.opts.progressStepBytes ?? PROGRESS_STEP_BYTES
    const now = Date.now()
    const interval = this.opts.progressIntervalMs ?? PROGRESS_INTERVAL_MS
    const steppedEnough = this.receivedBytes - this.reportedBytes >= step
    const waitedEnough = now - this.reportedAt >= interval
    if (!force && !steppedEnough && !waitedEnough) return

    this.reportedBytes = this.receivedBytes
    this.reportedAt = now
    this.opts.onProgress?.(this.receivedBytes, this.size)
  }

  private async onComplete(): Promise<void> {
    if (this.settled || this.cancelling) return
    this.silence.stop()
    const bitmap = this.bitmap
    if (!bitmap) throw new Error('Received complete before start')
    if (!bitmap.allSet()) {
      throw new Error(`Transfer incomplete: ${bitmap.count()}/${bitmap.size} chunks`)
    }

    const savedTo = await this.writer.finalize()
    this.settled = true
    this.silence.stop()
    try {
      this.channel.send({ type: 'ack', transferId: this.transferId!, savedTo })
    } catch {}
    this.settle.resolve(savedTo)
  }

  cancel(reason = 'Transfer cancelled'): void {
    if (this.settled || this.cancelling) return
    this.cancelling = true
    this.silence.stop()
    this.enqueue(() => this.fail(new Error(reason)))
  }

  private async fail(err: Error, { notifyPeer = true }: CancelOptions = {}): Promise<void> {
    if (this.settled) return
    this.settled = true
    this.silence.stop()
    if (notifyPeer && this.transferId !== null) {
      try {
        this.channel.send({ type: 'cancel', transferId: this.transferId, reason: err.message })
      } catch {}
    }
    try {
      await this.writer.abort()
    } catch {}
    this.settle.reject(err)
  }
}
