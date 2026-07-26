import { isOpfsSupported } from './opfsClient'
import { OpfsSink, type WebSink } from './opfsSink'
import { triggerDownload } from './saveFile'

export { sweepOpfs } from './opfsClient'

class MemorySink implements WebSink {
  bytes = new Uint8Array(0)
  async allocate(size: number): Promise<void> {
    if (this.bytes.length !== size) this.bytes = new Uint8Array(size)
  }
  async write(offset: number, data: Uint8Array): Promise<void> {
    this.bytes.set(data, offset)
  }
  async readBack(offset: number, length: number): Promise<Uint8Array | null> {
    return this.bytes.subarray(offset, offset + length)
  }
  async finalize(): Promise<string> {
    return 'memory'
  }
  async abort(): Promise<void> {}
  async discard(): Promise<void> {
    this.bytes = new Uint8Array(0)
  }
  async save(fileName: string): Promise<void> {
    triggerDownload(this.bytes, fileName)
  }
}

export type { WebSink } from './opfsSink'

export async function createSink(transferId: string): Promise<WebSink> {
  if (await isOpfsSupported()) return new OpfsSink(transferId)
  return new MemorySink()
}
