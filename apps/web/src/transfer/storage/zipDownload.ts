import { Zip, ZipPassThrough } from 'fflate'
import {
  FLUSH_GRACE_MS,
  startStreamDownload,
  streamReady,
  type StreamDownload
} from './streamClient'
import { triggerDownload } from './saveFile'

const EMPTY = new Uint8Array(0)

export class ZipDownload {
  private queue: Promise<void> = Promise.resolve()
  private failure: unknown = null
  private zip!: Zip
  private readonly blobChunks: Uint8Array[] = []

  private constructor(
    private readonly zipName: string,
    private readonly stream: StreamDownload | null
  ) {}

  static async open(zipName: string): Promise<ZipDownload> {
    const stream = (await streamReady()) ? await startStreamDownload(zipName, Infinity) : null
    const self = new ZipDownload(zipName, stream)
    self.zip = new Zip((err, chunk, final) => {
      if (err) {
        self.failure ??= err
        return
      }
      if (stream) {
        self.queue = self.queue.then(() => stream.writer.write(chunk))
        if (final) self.queue = self.queue.then(() => stream.writer.close())
      } else {
        self.blobChunks.push(chunk)
      }
    })
    return self
  }

  async addFile(name: string, file: File): Promise<void> {
    const entry = new ZipPassThrough(name)
    this.zip.add(entry)
    const reader = file.stream().getReader()
    for (;;) {
      const { done, value } = await reader.read()
      if (done) break
      entry.push(value, false)
      if (this.stream) await this.stream.writer.ready
      if (this.failure) throw this.failure
    }
    entry.push(EMPTY, true)
  }

  async finish(): Promise<void> {
    this.zip.end()
    await this.queue
    if (this.failure) throw this.failure
    if (this.stream) {
      setTimeout(this.stream.removeFrame, FLUSH_GRACE_MS)
    } else {
      triggerDownload(new Blob(this.blobChunks as BlobPart[]), this.zipName)
    }
  }

  async abort(err: unknown): Promise<void> {
    if (!this.stream) return
    await this.stream.writer
      .abort(err instanceof Error ? err : new Error(String(err)))
      .catch(() => {})
    this.stream.removeFrame()
  }
}
