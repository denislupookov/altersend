import type { ChunkWriter } from '@altersend/drive'

export class MemorySink implements ChunkWriter {
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
}

export function saveToDisk(bytes: Uint8Array, filename: string): void {
  const blob = new Blob([bytes as BlobPart])
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename || 'download.bin'
  a.click()
  setTimeout(() => URL.revokeObjectURL(url), 15000)
}
