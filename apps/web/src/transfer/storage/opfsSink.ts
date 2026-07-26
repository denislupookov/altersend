import type { ChunkWriter } from '@altersend/drive'
import { request } from './opfsClient'
import { DL_PREFIX } from './opfsProtocol'
import { triggerDownload } from './saveFile'

export interface WebSink extends ChunkWriter {
  save(fileName: string): Promise<void>
  discard(): Promise<void>
}

function safeName(transferId: string): string {
  return `${DL_PREFIX}${transferId.replace(/[^a-zA-Z0-9_-]/g, '')}`
}

export class OpfsSink implements WebSink {
  private readonly name: string

  constructor(transferId: string) {
    this.name = safeName(transferId)
  }

  async allocate(size: number): Promise<void> {
    await request({ type: 'open', name: this.name, size })
  }

  async write(offset: number, data: Uint8Array): Promise<void> {
    const buffer = data.slice().buffer
    await request({ type: 'write', name: this.name, offset, buffer }, [buffer])
  }

  async readBack(): Promise<Uint8Array | null> {
    return null
  }

  async finalize(): Promise<string> {
    await request({ type: 'finalize', name: this.name })
    return 'opfs'
  }

  async abort(): Promise<void> {
    await request({ type: 'abort', name: this.name })
  }

  async discard(): Promise<void> {
    await request({ type: 'discard', name: this.name })
  }

  async save(fileName: string): Promise<void> {
    const root = await navigator.storage.getDirectory()
    const handle = await root.getFileHandle(this.name)
    const file = await handle.getFile()
    triggerDownload(file, fileName)
  }
}
