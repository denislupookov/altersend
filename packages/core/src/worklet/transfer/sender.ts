import crypto from 'hypercore-crypto'
import fs from 'bare-fs'
import b4a from 'b4a'
import Localdrive from 'localdrive'
import MirrorDrive from 'mirror-drive'
import type Hyperdrive from 'hyperdrive'
import { AbortError, getDirname, getFileName } from './utils'
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

/**
 * TransferSender handles the **sender** side of a file transfer.
 *
 * Responsibilities:
 *   - Scanning local file paths to gather metadata (size, name) without
 *     modifying any shared state — so transfer-start can be announced first
 *   - Importing scanned files into the shared Hyperdrive one by one
 *   - Building TransferStart / TransferReady control messages
 *
 * It has no knowledge of Hyperswarm, peer sessions, or disk download logic.
 */
export class TransferSender {
  private readonly drive: Hyperdrive
  private readonly scanDrives: Set<Localdrive> = new Set()

  constructor(drive: Hyperdrive) {
    this.drive = drive
  }

  get driveKey(): string {
    return b4a.toString(this.drive.key, 'hex')
  }

  async scanFiles(requests: { path: string; isTemporary?: boolean }[]): Promise<ScanResult> {
    const files: ScannedFile[] = []
    const errors: string[] = []
    let totalBytes = 0

    const driveByDir = new Map<string, Localdrive>()

    for (const req of requests) {
      const path = req.path
      const fileName = getFileName(path)
      const sourcePath = `/${fileName}`
      const dir = getDirname(path)
      let sourceDrive = driveByDir.get(dir)
      if (!sourceDrive) {
        sourceDrive = new Localdrive(dir)
        driveByDir.set(dir, sourceDrive)
        this.scanDrives.add(sourceDrive)
        await sourceDrive.ready()
      }
      const entry = await sourceDrive.entry(sourcePath)

      if (!entry?.value?.blob) {
        const existingEntry = await this.drive.entry(sourcePath)
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

  async stageFiles(
    files: ScannedFile[],
    transferId: string,
    onStaging: (file: ScannedFile) => void,
    signal?: AbortSignal
  ): Promise<FileOffer[]> {
    const offers: FileOffer[] = []

    for (const file of files) {
      if (signal?.aborted) throw new AbortError()
      onStaging(file)
      if (!file.alreadyStaged) {
        await this.importToDrive(file.sourceDrive, file.sourcePath)
        if (file.isTemporary) {
          await this.tryDeleteFile(file.inputPath)
        }
      }
      offers.push({
        id: createFileId(),
        transferId,
        name: file.fileName,
        path: file.sourcePath,
        size: file.size,
        driveKey: this.driveKey
      })
    }

    return offers
  }

  private async importToDrive(sourceDrive: Localdrive, sourcePath: string): Promise<void> {
    const mirror = new MirrorDrive(sourceDrive, this.drive, {
      entries: [sourcePath],
      prune: false
    })
    await mirror.done()
  }

  private async tryDeleteFile(filePath: string): Promise<void> {
    try {
      await fs.promises.unlink(filePath)
    } catch (err) {
      console.warn(`TransferSender: failed to delete temporary file ${filePath}`, err)
    }
  }
}
