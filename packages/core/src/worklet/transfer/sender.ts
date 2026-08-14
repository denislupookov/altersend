import crypto from 'hypercore-crypto'
import fs from 'bare-fs'
import { getFileName, toRelativePath, toSafeFileName } from './utils'
import type { FileOffer } from './control-channel'

export interface ScannedFile {
  fileName: string
  displayName: string
  inputPath: string
  sourcePath: string
  size: number
  isTemporary?: boolean
}

export interface ScanResult {
  files: ScannedFile[]
  totalBytes: number
  errors: string[]
}

function createFileId(): string {
  return crypto.randomBytes(12).toString('hex')
}

function resolveRelativePath(
  path: string,
  requestedRelativePath: string | undefined,
  fileName: string
): string {
  const normalizedPath = path.replace(/\\/g, '/')
  const relativePath = toRelativePath(requestedRelativePath ?? fileName)

  if (relativePath && normalizedPath.endsWith(`/${relativePath}`)) return relativePath
  return fileName
}

async function readableSize(path: string): Promise<number | null> {
  try {
    const stats = await fs.promises.stat(path)
    return stats.isFile() ? stats.size : null
  } catch (err) {
    console.warn(`TransferSender: cannot stat ${path}`, err)
    return null
  }
}

export class TransferSender {
  private readonly sourcePaths = new Map<string, string>()
  private readonly temporaryPaths = new Set<string>()

  localPath(fileId: string): string | null {
    return this.sourcePaths.get(fileId) ?? null
  }

  async scanFiles(
    requests: { path: string; name?: string; relativePath?: string; isTemporary?: boolean }[]
  ): Promise<ScanResult> {
    const files: ScannedFile[] = []
    const errors: string[] = []
    let totalBytes = 0

    for (const req of requests) {
      const fileName = getFileName(req.path)
      const displayName = req.name ? toSafeFileName(req.name, fileName) : fileName
      const size = await readableSize(req.path)

      if (size === null) {
        errors.push(`Could not read file: ${fileName}`)
        continue
      }

      totalBytes += size
      files.push({
        fileName,
        displayName,
        inputPath: req.path,
        sourcePath: `/${resolveRelativePath(req.path, req.relativePath, fileName)}`,
        size,
        isTemporary: req.isTemporary
      })
    }

    return { files, totalBytes, errors }
  }

  buildOffers(files: ScannedFile[], transferId: string): FileOffer[] {
    return files.map((file) => {
      const id = createFileId()
      this.sourcePaths.set(id, file.inputPath)
      if (file.isTemporary) this.temporaryPaths.add(file.inputPath)
      return {
        id,
        transferId,
        name: file.displayName,
        path: file.sourcePath,
        size: file.size,
        kind: 'file'
      }
    })
  }

  async reset(): Promise<void> {
    this.sourcePaths.clear()

    const temporaries = Array.from(this.temporaryPaths)
    this.temporaryPaths.clear()
    for (const path of temporaries) {
      await this.tryDeleteFile(path)
    }
  }

  private async tryDeleteFile(filePath: string): Promise<void> {
    try {
      await fs.promises.unlink(filePath)
    } catch (err) {
      console.warn(`TransferSender: failed to delete temporary file ${filePath}`, err)
    }
  }
}
