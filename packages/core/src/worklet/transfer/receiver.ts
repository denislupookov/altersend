import Hyperdrive from 'hyperdrive'
import type Corestore from 'corestore'
import b4a from 'b4a'
import fs from 'bare-fs'
import { receiveFile, type DriveChannel } from '@altersend/drive'
import {
  AbortError,
  getDirname,
  getFileName,
  isPathSafe,
  isSafeRelativePath,
  isValidHexKey,
  joinFilePath,
  onAbort,
  toRelativePath
} from './utils'
import type { DownloadFileRequest, DownloadFileResult } from '../rpc/protocol'
import type { DownloaderCallbacks } from './download-events'

type DownloadFileOutcome = { ok: true; savedTo: string } | { ok: false; message: string }

function fileEvents(
  file: DownloadFileRequest,
  callbacks: DownloaderCallbacks,
  targetPath: string,
  totalBytes: number
) {
  const base = {
    transferId: file.transferId,
    fileId: file.fileId,
    fileName: file.name ?? getFileName(file.path),
    sourcePath: file.path,
    targetPath,
    totalBytes
  }
  return {
    started: () => callbacks.onFileStart({ ...base, bytesTransferred: 0 }),
    progressed: (bytesTransferred: number) =>
      callbacks.onFileProgress({ ...base, bytesTransferred }),
    completed: () => callbacks.onFileComplete({ ...base, bytesTransferred: totalBytes }),
    failed: (message: string): DownloadFileOutcome => {
      callbacks.onFileError({ ...base, message })
      return { ok: false, message }
    }
  }
}

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
    signal?: AbortSignal,
    driveFor?: (file: DownloadFileRequest) => Promise<DriveChannel | null>
  ): Promise<DownloadFileResult[]> {
    const results: DownloadFileResult[] = []

    for (const file of files) {
      const resolvedName = file.name ?? getFileName(file.path)
      const record = (outcome: DownloadFileOutcome) =>
        results.push({ fileId: file.fileId, fileName: resolvedName, ...outcome })
      const fail = (targetPath: string, message: string) =>
        record(fileEvents(file, callbacks, targetPath, file.size ?? 0).failed(message))

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
        fail(file.targetPath ?? file.targetDir ?? '', 'Rejected unsafe file path from sender')
        continue
      }

      const candidatePath = file.targetPath ?? file.targetDir
      if (!isPathSafe(candidatePath)) {
        fail(candidatePath ?? '', 'Rejected unsafe target path from renderer')
        continue
      }

      const targetPath = file.targetPath ?? joinFilePath(file.targetDir!, relativeTarget)

      try {
        const channel = (await driveFor?.(file)) ?? null
        record(
          channel
            ? await this.downloadViaDrive(file, targetPath, callbacks, channel, signal)
            : await this.downloadFile(file, targetPath, callbacks, signal)
        )
      } catch (error) {
        await this.evictRemoteDrive(file.driveKey)

        fail(targetPath, error instanceof Error ? error.message : String(error))
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
    const announced = fileEvents(file, callbacks, targetPath, file.size ?? 0)

    const entry = await remoteDrive.entry(file.path)
    if (!entry?.value?.blob) {
      return announced.failed(`Could not find remote file: ${resolvedName}`)
    }

    const actualBytes = entry.value.blob.byteLength
    if (typeof file.size === 'number' && file.size !== actualBytes) {
      return announced.failed(`Sender claimed ${file.size} bytes but file is ${actualBytes} bytes`)
    }

    const events = fileEvents(file, callbacks, targetPath, actualBytes)
    events.started()

    const savedTo = await this.writeToDisk(
      remoteDrive,
      file.path,
      targetPath,
      actualBytes,
      (bytesTransferred) => events.progressed(bytesTransferred),
      signal
    )

    events.completed()
    return { ok: true, savedTo }
  }

  private async downloadViaDrive(
    file: DownloadFileRequest,
    targetPath: string,
    callbacks: DownloaderCallbacks,
    channel: DriveChannel,
    signal?: AbortSignal
  ): Promise<DownloadFileOutcome> {
    try {
      const finalPath = await this.findUniqueTargetPath(targetPath)
      const events = fileEvents(file, callbacks, finalPath, file.size ?? 0)

      const pending = receiveFile(finalPath, channel, {
        transferId: file.fileId,
        expectedSize: file.size,
        signal,
        onProgress: (bytesTransferred) => events.progressed(bytesTransferred)
      })

      events.started()
      try {
        await pending
        events.completed()
        return { ok: true, savedTo: finalPath }
      } catch (err) {
        return events.failed(err instanceof Error ? err.message : String(err))
      }
    } finally {
      channel.close()
    }
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
  ): Promise<string> {
    const { default: Localdrive } = await import('localdrive')
    const destination = new Localdrive(getDirname(targetPath))
    const partName = `${getFileName(targetPath)}.part`
    const partPath = `${targetPath}.part`

    const readStream = remoteDrive.createReadStream(sourcePath)
    const writeStream = destination.createWriteStream(`/${partName}`)

    let release = () => {}

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
        release = onAbort(signal, () => {
          finish(new AbortError())
          try {
            readStream.destroy()
          } catch {}
          try {
            writeStream.destroy()
          } catch {}
        })

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
      release()
    }

    const finalPath = await this.findUniqueTargetPath(targetPath)
    await fs.promises.rename(partPath, finalPath)
    return finalPath
  }
}
