import crypto from 'hypercore-crypto'
import fs from 'bare-fs'
import Localdrive from 'localdrive'
import type Hyperdrive from 'hyperdrive'
import { getDirname, getFileName, toRelativePath } from './utils'
import { LegacyPeerStaging } from './legacy/staging'
import type { FileOffer } from './control-channel'

export interface ScannedFile {
  fileName: string
  inputPath: string
  sourcePath: string
  sourceDrive: Localdrive
  size: number
  isTemporary?: boolean
  alreadyStaged?: boolean
}

export interface ScanResult {
  files: ScannedFile[]
  totalBytes: number
  errors: string[]
}

function createFileId(): string {
  return crypto.randomBytes(12).toString('hex')
}

function resolveSource(
  path: string,
  requestedRelativePath: string | undefined,
  fileName: string
): { root: string; relativePath: string } {
  const normalizedPath = path.replace(/\\/g, '/')
  const relativePath = toRelativePath(requestedRelativePath ?? fileName)
  const suffix = `/${relativePath}`

  if (relativePath && normalizedPath.endsWith(suffix)) {
    return {
      root: normalizedPath.slice(0, normalizedPath.length - suffix.length) || '/',
      relativePath
    }
  }

  return { root: getDirname(path), relativePath: fileName }
}

export class TransferSender {
  readonly legacy: LegacyPeerStaging
  private readonly scanDrives: Set<Localdrive> = new Set()
  private readonly sourcePaths = new Map<string, string>()
  private readonly temporaryPaths = new Set<string>()

  constructor(drive: Hyperdrive) {
    this.legacy = new LegacyPeerStaging(drive)
  }

  localPath(fileId: string): string | null {
    return this.sourcePaths.get(fileId) ?? null
  }

  get driveKey(): string {
    return this.legacy.driveKey
  }

  async scanFiles(
    requests: { path: string; relativePath?: string; isTemporary?: boolean }[]
  ): Promise<ScanResult> {
    const files: ScannedFile[] = []
    const errors: string[] = []
    let totalBytes = 0

    const driveByDir = new Map<string, Localdrive>()

    for (const req of requests) {
      const path = req.path
      const fileName = getFileName(path)
      const { root, relativePath } = resolveSource(path, req.relativePath, fileName)
      const sourcePath = `/${relativePath}`
      let sourceDrive = driveByDir.get(root)
      if (!sourceDrive) {
        sourceDrive = new Localdrive(root)
        driveByDir.set(root, sourceDrive)
        this.scanDrives.add(sourceDrive)
        await sourceDrive.ready()
      }
      const entry = await sourceDrive.entry(sourcePath)

      if (!entry?.value?.blob) {
        const existingEntry = await this.legacy.stagedEntry(sourcePath)
        if (existingEntry?.value?.blob) {
          const size = existingEntry.value.blob.byteLength
          totalBytes += size
          files.push({
            fileName,
            inputPath: path,
            sourcePath,
            sourceDrive,
            size,
            isTemporary: req.isTemporary,
            alreadyStaged: true
          })
          continue
        }
        errors.push(`Could not read file: ${fileName}`)
        continue
      }

      const size = entry.value.blob.byteLength
      totalBytes += size
      files.push({
        fileName,
        inputPath: path,
        sourcePath,
        sourceDrive,
        size,
        isTemporary: req.isTemporary
      })
    }

    return { files, totalBytes, errors }
  }

  async closeSourceDrives(): Promise<void> {
    const drives = Array.from(this.scanDrives)
    this.scanDrives.clear()
    for (const drive of drives) {
      try {
        await drive.close()
      } catch (err) {
        console.warn('TransferSender: close source drive failed', err)
      }
    }
  }

  buildOffers(files: ScannedFile[], transferId: string): FileOffer[] {
    this.legacy.setPendingFiles(files)

    return files.map((file) => {
      const id = createFileId()
      if (!file.alreadyStaged) this.sourcePaths.set(id, file.inputPath)
      if (file.isTemporary) this.temporaryPaths.add(file.inputPath)
      return {
        id,
        transferId,
        name: file.fileName,
        path: file.sourcePath,
        size: file.size,
        driveKey: this.driveKey,
        kind: 'file'
      }
    })
  }

  stageForLegacyPeers(onStaging: (file: ScannedFile) => void, signal?: AbortSignal): Promise<void> {
    return this.legacy.stage(onStaging, () => this.closeSourceDrives(), signal)
  }

  async reset(): Promise<void> {
    this.sourcePaths.clear()
    this.legacy.reset()
    await this.closeSourceDrives()

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
