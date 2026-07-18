import fs from '#fs'
import type { FileHandle } from 'node:fs/promises'
import type { ChunkWriter } from '../engine/types'
import { readRange } from './read-range'

export class DiskWriter implements ChunkWriter {
  private readonly targetPath: string
  private readonly partPath: string
  private handle: FileHandle | null = null

  constructor(targetPath: string) {
    this.targetPath = targetPath
    this.partPath = `${targetPath}.part`
  }

  async allocate(size: number): Promise<void> {
    try {
      this.handle = await fs.open(this.partPath, 'r+')
    } catch (err) {
      if ((err as NodeJS.ErrnoException).code !== 'ENOENT') throw err
      this.handle = await fs.open(this.partPath, 'w+')
    }
    await this.handle.truncate(size)
  }

  async write(offset: number, data: Uint8Array): Promise<void> {
    if (!this.handle) throw new Error('DiskWriter.write before allocate')
    await this.handle.write(data, 0, data.length, offset)
  }

  async readBack(offset: number, length: number): Promise<Uint8Array | null> {
    if (!this.handle) return null
    return readRange(this.handle, offset, length)
  }

  async finalize(): Promise<string> {
    if (this.handle) {
      await this.handle.close()
      this.handle = null
    }
    await fs.rename(this.partPath, this.targetPath)
    return this.targetPath
  }

  async abort(): Promise<void> {
    if (this.handle) {
      await this.handle.close()
      this.handle = null
    }
    try {
      await fs.unlink(this.partPath)
    } catch {}
  }
}
