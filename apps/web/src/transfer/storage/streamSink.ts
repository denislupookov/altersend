import { startStreamDownload } from './streamClient'
import type { WebSink } from './opfsSink'

const FLUSH_GRACE_MS = 5000

export class StreamSink implements WebSink {
  private writer: WritableStreamDefaultWriter<Uint8Array> | null = null
  private removeFrame: (() => void) | null = null
  private written = 0

  constructor(private readonly fileName: string) {}

  async allocate(size: number): Promise<void> {
    const { writer, removeFrame } = await startStreamDownload(this.fileName, size)
    this.writer = writer
    this.removeFrame = removeFrame
  }

  async write(offset: number, data: Uint8Array): Promise<void> {
    if (!this.writer) throw new Error('StreamSink: write before allocate')
    if (offset !== this.written) {
      throw new Error(`StreamSink: non-sequential write at ${offset}, expected ${this.written}`)
    }
    await this.writer.write(data)
    this.written += data.length
  }

  async readBack(): Promise<Uint8Array | null> {
    return null
  }

  async finalize(): Promise<string> {
    await this.writer?.close()
    const remove = this.removeFrame
    this.removeFrame = null
    if (remove) setTimeout(remove, FLUSH_GRACE_MS)
    return 'stream'
  }

  async abort(): Promise<void> {
    await this.writer?.abort(new Error('Transfer aborted')).catch(() => {})
    this.removeFrame?.()
    this.removeFrame = null
  }

  async discard(): Promise<void> {
    await this.abort()
  }

  async save(): Promise<void> {}
}
