import Hyperdrive from 'hyperdrive'
import type Corestore from 'corestore'
import b4a from 'b4a'
import fs from 'bare-fs'
import {
  AbortError,
  getDirname,
  getFileName,
  isPathSafe,
  isSafeRelativePath,
  isValidHexKey,
  joinFilePath,
  toRelativePath
} from './utils'
import type { DownloadFileRequest, DownloadFileResult } from '../rpc/protocol'
import type { DownloaderCallbacks } from './download-events'

type DownloadFileOutcome = { ok: true } | { ok: false; message: string }

function getChunkSize(chunk: unknown): number {
  if (typeof chunk === 'string') return Buffer.byteLength(chunk)
  if (
    chunk &&
    typeof chunk === 'object' &&
    'byteLength' in chunk &&
    typeof (chunk as { byteLength: unknown }).byteLength === 'number'
  ) {
    return (chunk as { byteLength: number }).byteLength
  }
  return 0
}

/**
 * TransferReceiver handles the **receiver** side of a file transfer.
 *
 * Responsibilities:
 *   - Opening a remote Hyperdrive by its public key
 *   - Downloading file blobs from the remote drive via the shared Corestore
 *   - Writing the downloaded data to a target path on the local disk
 *
 * It has no knowledge of Hyperswarm, peer sessions, or file staging.
 */
export class TransferReceiver {
  private readonly driveStore: Corestore
  private readonly remoteDrives: Map<string, Hyperdrive>

  constructor(driveStore: Corestore) {
    this.driveStore = driveStore
    this.remoteDrives = new Map()
  }

  async downloadFiles(
    files: DownloadFileRequest[],
    callbacks: DownloaderCallbacks,
    signal?: AbortSignal
  ): Promise<DownloadFileResult[]> {
    const results: DownloadFileResult[] = []

    for (const file of files) {
      const resolvedName = file.name ?? getFileName(file.path)
      const fail = (fileName: string, targetPath: string, message: string) => {
        callbacks.onFileError({
          transferId: file.transferId,
          fileId: file.fileId,
          fileName,
          sourcePath: file.path,
          targetPath,
          totalBytes: file.size ?? 0,
          message
        })
        results.push({ fileId: file.fileId, fileName, ok: false, message })
      }

      if (signal?.aborted) {
        results.push({
          fileId: file.fileId,
          fileName: resolvedName,
          ok: false,
          message: 'Cancelled'
        })
        continue
      }

      const relativeTarget = toRelativePath(file.path)
      if (!isSafeRelativePath(relativeTarget)) {
        fail(
          resolvedName,
          file.targetPath ?? file.targetDir ?? '',
          'Rejected unsafe file path from sender'
        )
        continue
      }

      const candidatePath = file.targetPath ?? file.targetDir
      if (!isPathSafe(candidatePath)) {
        fail(resolvedName, candidatePath ?? '', 'Rejected unsafe target path from renderer')
        continue
      }

      const targetPath = file.targetPath ?? joinFilePath(file.targetDir!, relativeTarget)

      try {
        const outcome = await this.downloadFile(file, targetPath, callbacks, signal)
        if (outcome.ok) {
          results.push({
            fileId: file.fileId,
            fileName: resolvedName,
            ok: true,
            savedTo: targetPath
          })
        } else {
          results.push({
            fileId: file.fileId,
            fileName: resolvedName,
            ok: false,
            message: outcome.message
          })
        }
      } catch (error) {
        await this.evictRemoteDrive(file.driveKey)

        fail(resolvedName, targetPath, error instanceof Error ? error.message : String(error))
      }
    }

    return results
  }

  private async downloadFile(
    file: DownloadFileRequest,
    targetPath: string,
    callbacks: DownloaderCallbacks,
    signal?: AbortSignal
  ): Promise<DownloadFileOutcome> {
    const remoteDrive = await this.getRemoteDrive(file.driveKey)
    const resolvedName = file.name ?? getFileName(file.path)
    const fail = (message: string, totalBytes: number = file.size ?? 0): DownloadFileOutcome => {
      callbacks.onFileError({
        transferId: file.transferId,
        fileId: file.fileId,
        fileName: resolvedName,
        sourcePath: file.path,
        targetPath,
        totalBytes,
        message
      })
      return { ok: false, message }
    }

    const entry = await remoteDrive.entry(file.path)
    if (!entry?.value?.blob) {
      return fail(`Could not find remote file: ${resolvedName}`)
    }

    const actualBytes = entry.value.blob.byteLength
    if (typeof file.size === 'number' && file.size !== actualBytes) {
      return fail(`Sender claimed ${file.size} bytes but file is ${actualBytes} bytes`, file.size)
    }

    const totalBytes = actualBytes
    callbacks.onFileStart({
      transferId: file.transferId,
      fileId: file.fileId,
      fileName: resolvedName,
      sourcePath: file.path,
      targetPath,
      totalBytes,
      bytesTransferred: 0
    })

    await this.writeToDisk(
      remoteDrive,
      file.path,
      targetPath,
      totalBytes,
      (bytesTransferred) => {
        callbacks.onFileProgress({
          transferId: file.transferId,
          fileId: file.fileId,
          fileName: resolvedName,
          sourcePath: file.path,
          targetPath,
          totalBytes,
          bytesTransferred
        })
      },
      signal
    )

    callbacks.onFileComplete({
      transferId: file.transferId,
      fileId: file.fileId,
      fileName: resolvedName,
      sourcePath: file.path,
      targetPath,
      totalBytes,
      bytesTransferred: totalBytes
    })
    return { ok: true }
  }

  private async evictRemoteDrive(driveKey: string): Promise<void> {
    const cached = this.remoteDrives.get(driveKey)
    if (!cached) return
    this.remoteDrives.delete(driveKey)
    try {
      await cached.close()
    } catch (err) {
      console.warn('TransferReceiver: failed to close evicted drive', err)
    }
  }

  private async getRemoteDrive(driveKey: string): Promise<Hyperdrive> {
    if (!isValidHexKey(driveKey)) {
      throw new Error(`Invalid drive key format: expected 64 hex chars`)
    }
    const existingDrive = this.remoteDrives.get(driveKey)
    if (existingDrive) {
      try {
        await existingDrive.update({ wait: true })
      } catch (err) {
        console.warn('TransferReceiver: update on cached drive failed, using cached state', err)
      }
      return existingDrive
    }

    const remoteDrive = new Hyperdrive(this.driveStore, b4a.from(driveKey, 'hex'))
    await remoteDrive.ready()
    try {
      await remoteDrive.update({ wait: true })
    } catch (err) {
      try {
        await remoteDrive.close()
      } catch {}
      throw new Error(
        `Could not sync with peer drive: ${err instanceof Error ? err.message : String(err)}`
      )
    }
    this.remoteDrives.set(driveKey, remoteDrive)
    return remoteDrive
  }

  async reset(): Promise<void> {
    const drives = Array.from(this.remoteDrives.values())
    this.remoteDrives.clear()
    for (const drive of drives) {
      try {
        await drive.close()
      } catch (err) {
        console.warn('TransferReceiver: close drive failed', err)
      }
    }
  }

  async destroy(): Promise<void> {
    await this.reset()
  }

  private fileExists(filePath: string): Promise<boolean> {
    return new Promise((resolve) => {
      // bare-fs.promises lacks stat; the callback form is always present.
      ;(fs as unknown as { stat(p: string, cb: (e: unknown) => void): void }).stat(
        filePath,
        (err) => resolve(!err)
      )
    })
  }

  private async findUniqueTargetPath(targetPath: string): Promise<string> {
    if (!(await this.fileExists(targetPath))) return targetPath
    const dir = getDirname(targetPath)
    const filename = getFileName(targetPath)
    const dotIdx = filename.lastIndexOf('.')
    const base = dotIdx > 0 ? filename.slice(0, dotIdx) : filename
    const ext = dotIdx > 0 ? filename.slice(dotIdx) : ''
    for (let i = 1; i <= 999; i++) {
      const candidate = joinFilePath(dir, `${base} (${i})${ext}`)
      if (!(await this.fileExists(candidate))) return candidate
    }
    return targetPath
  }

  private async writeToDisk(
    remoteDrive: Hyperdrive,
    sourcePath: string,
    targetPath: string,
    totalBytes: number,
    onProgress: (bytesTransferred: number) => void,
    signal?: AbortSignal
  ): Promise<void> {
    const { default: Localdrive } = await import('localdrive')
    const destination = new Localdrive(getDirname(targetPath))
    const partName = `${getFileName(targetPath)}.part`
    const partPath = `${targetPath}.part`

    const readStream = remoteDrive.createReadStream(sourcePath)
    const writeStream = destination.createWriteStream(`/${partName}`)

    let onAbort: (() => void) | undefined

    try {
      await new Promise<void>((resolve, reject) => {
        let settled = false
        let bytesTransferred = 0
        let lastReportedBytes = 0

        const finish = (err?: Error) => {
          if (settled) return
          settled = true
          if (err) reject(err)
          else resolve()
        }

        // Settle before destroying streams so the outer catch sees AbortError, not stream-destroyed.
        if (signal) {
          onAbort = () => {
            finish(new AbortError())
            try {
              readStream.destroy()
            } catch {}
            try {
              writeStream.destroy()
            } catch {}
          }
          if (signal.aborted) onAbort()
          else signal.addEventListener('abort', onAbort)
        }

        readStream.on('data', (chunk: unknown) => {
          bytesTransferred += getChunkSize(chunk)
          const nextBytes =
            totalBytes > 0 ? Math.min(bytesTransferred, totalBytes) : bytesTransferred
          if (nextBytes === totalBytes || nextBytes - lastReportedBytes >= 64 * 1024) {
            lastReportedBytes = nextBytes
            onProgress(nextBytes)
          }
        })
        readStream.once('error', finish)
        writeStream.once('error', finish)
        writeStream.once('close', () => {
          if (totalBytes > 0 && lastReportedBytes < totalBytes) {
            onProgress(totalBytes)
          }
          finish()
        })
        readStream.pipe(writeStream)
      })
    } catch (err) {
      try {
        await fs.promises.unlink(partPath)
      } catch (cleanupErr) {
        if ((cleanupErr as NodeJS.ErrnoException)?.code !== 'ENOENT') {
          console.warn('TransferReceiver: failed to delete partial file', partPath, cleanupErr)
        }
      }
      throw err
    } finally {
      if (signal && onAbort) signal.removeEventListener('abort', onAbort)
    }

    const finalPath = await this.findUniqueTargetPath(targetPath)
    await fs.promises.rename(partPath, finalPath)
  }
}
