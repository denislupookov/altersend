import { open, stat, type FileHandle } from 'node:fs/promises'
import type { ChunkReader } from '../engine/types'
import { readRange } from './read-range'

export class DiskReader implements ChunkReader {
  private readonly path: string
  private opening: Promise<FileHandle> | null = null

  constructor(path: string) {
    this.path = path
  }

  private handle(): Promise<FileHandle> {
    if (!this.opening) this.opening = open(this.path, 'r')
    return this.opening
  }

  async size(): Promise<number> {
    return (await stat(this.path)).size
  }

  async read(offset: number, length: number): Promise<Uint8Array> {
    return readRange(await this.handle(), offset, length)
  }

  async close(): Promise<void> {
    const pending = this.opening
    this.opening = null
    if (!pending) return
    try {
      await (await pending).close()
    } catch {}
  }
}
