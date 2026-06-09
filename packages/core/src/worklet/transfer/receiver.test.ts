import { PassThrough, Readable } from 'node:stream'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type Corestore from 'corestore'

const fsState = vi.hoisted(() => ({
  existing: new Set<string>(),
  renamed: [] as Array<{ from: string; to: string }>,
  unlinked: [] as string[],
  reset() {
    this.existing.clear()
    this.renamed.length = 0
    this.unlinked.length = 0
  }
}))

const localdriveState = vi.hoisted(() => ({
  writePaths: [] as string[],
  reset() {
    this.writePaths.length = 0
  }
}))

function joinLocalPath(dir: string, childPath: string): string {
  const child = childPath.replace(/^[/\\]+/, '')
  return `${dir.replace(/[\\/]+$/, '')}/${child}`
}

vi.mock('bare-fs', () => ({
  default: {
    stat(filePath: string, cb: (error: Error | null) => void) {
      cb(fsState.existing.has(filePath) ? null : new Error('ENOENT'))
    },
    promises: {
      async unlink(filePath: string) {
        fsState.unlinked.push(filePath)
        if (!fsState.existing.delete(filePath)) {
          const error = new Error('ENOENT') as NodeJS.ErrnoException
          error.code = 'ENOENT'
          throw error
        }
      },
      async rename(from: string, to: string) {
        fsState.renamed.push({ from, to })
        fsState.existing.delete(from)
        fsState.existing.add(to)
      }
    }
  }
}))

vi.mock('hyperdrive', () => ({
  default: class MockHyperdrive {
    async ready() {}
    async update() {}
    async close() {}
    async entry() {
      return { value: { blob: { byteLength: 5 } } }
    }
    createReadStream() {
      return Readable.from([Buffer.from('hello')])
    }
  }
}))

vi.mock('localdrive', () => ({
  default: class MockLocaldrive {
    private readonly dir: string

    constructor(dir: string) {
      this.dir = dir
    }

    createWriteStream(childPath: string) {
      const fullPath = joinLocalPath(this.dir, childPath)
      localdriveState.writePaths.push(fullPath)
      fsState.existing.add(fullPath)
      const stream = new PassThrough()
      stream.on('finish', () => stream.emit('close'))
      return stream
    }
  }
}))

const { TransferReceiver } = await import('./receiver')

describe('TransferReceiver temp file handling', () => {
  beforeEach(() => {
    fsState.reset()
    localdriveState.reset()
  })

  it('preserves an existing sibling .part file by writing to a unique temp path', async () => {
    fsState.existing.add('/downloads/report.txt')
    fsState.existing.add('/downloads/report.txt.part')
    const receiver = new TransferReceiver({} as unknown as Corestore)

    const result = await receiver.downloadFiles(
      [
        {
          transferId: 'transfer-1',
          fileId: 'file-1',
          driveKey: 'a'.repeat(64),
          path: '/report.txt',
          name: 'report.txt',
          size: 5,
          targetDir: '/downloads'
        }
      ],
      {
        onFileStart: vi.fn(),
        onFileProgress: vi.fn(),
        onFileComplete: vi.fn(),
        onFileError: vi.fn()
      }
    )

    expect(result[0]).toMatchObject({ ok: true, savedTo: '/downloads/report (1).txt' })
    expect(localdriveState.writePaths).not.toContain('/downloads/report.txt.part')
    expect(fsState.existing.has('/downloads/report.txt.part')).toBe(true)
    expect(fsState.renamed).toEqual([
      { from: '/downloads/report (1).txt.part', to: '/downloads/report (1).txt' }
    ])
  })
})
