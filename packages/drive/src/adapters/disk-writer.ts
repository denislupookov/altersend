import fs from '#fs'
import path from '#path'
import type { FileHandle } from 'node:fs/promises'
import type { ChunkWriter } from '../engine/types'
import { readRange } from './read-range'
import { firstFreePath } from '../engine/paths'

export interface DiskWriterOptions {
  overwrite?: boolean
}

export class DiskWriter implements ChunkWriter {
  private readonly targetPath: string
  private readonly partPath: string
  private readonly overwrite: boolean
  private handle: FileHandle | null = null

  constructor(targetPath: string, { overwrite = false }: DiskWriterOptions = {}) {
    this.targetPath = targetPath
    this.partPath = `${targetPath}.part`
    this.overwrite = overwrite
  }

  async allocate(size: number): Promise<void> {
    await fs.mkdir(path.dirname(this.partPath), { recursive: true })
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
    const { bytesWritten } = await this.handle.write(data, 0, data.length, offset)
    if (bytesWritten !== data.length) {
      throw new Error(`Short write at ${offset}: ${bytesWritten} of ${data.length} bytes`)
    }
  }

  async readBack(offset: number, length: number): Promise<Uint8Array | null> {
    if (!this.handle) return null
    return readRange(this.handle, offset, length)
  }

  async finalize(): Promise<string> {
    await this.closeHandle()
    const destination = this.overwrite ? this.targetPath : await freePath(this.targetPath)
    await fs.rename(this.partPath, destination)
    return destination
  }

  async abort(): Promise<void> {
    await this.closeHandle()
  }

  private async closeHandle(): Promise<void> {
    if (!this.handle) return
    await this.handle.close()
    this.handle = null
  }
}

async function exists(path: string): Promise<boolean> {
  try {
    await fs.stat(path)
    return true
  } catch {
    return false
  }
}

function freePath(targetPath: string): Promise<string> {
  return firstFreePath(targetPath, async (candidate) => !(await exists(candidate)))
}

export function partialPath(targetPath: string): string {
  return `${targetPath}.part`
}

export async function discardPartial(targetPath: string): Promise<void> {
  try {
    await fs.unlink(partialPath(targetPath))
  } catch (err) {
    if ((err as NodeJS.ErrnoException)?.code !== 'ENOENT') {
      console.warn('discardPartial: failed to remove', targetPath, err)
    }
  }
}
