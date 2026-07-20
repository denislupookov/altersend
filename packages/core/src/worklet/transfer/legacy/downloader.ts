import Hyperdrive from 'hyperdrive'
import type Corestore from 'corestore'
import b4a from 'b4a'
import fs from 'bare-fs'
import { firstFreePath } from '@altersend/drive'
import {
  AbortError,
  type AbortLike,
  getChunkSize,
  getDirname,
  getFileName,
  isValidHexKey,
  onAbort
} from '../utils'
import { fileExists } from '../fs-utils'
import {
  DownloadReporter,
  type DownloaderCallbacks,
  type DownloadFileOutcome
} from '../download-events'
import type { DownloadFileRequest } from '../../rpc/protocol'

export class LegacyHyperdriveDownloader {
  private readonly driveStore: Corestore
  private readonly remoteDrives = new Map<string, Hyperdrive>()

  constructor(driveStore: Corestore) {
    this.driveStore = driveStore
  }

  async download(
    file: DownloadFileRequest,
    targetPath: string,
    callbacks: DownloaderCallbacks,
    signal?: AbortLike
  ): Promise<DownloadFileOutcome> {
    const remoteDrive = await this.getRemoteDrive(file.driveKey)
    const resolvedName = file.name ?? getFileName(file.path)
    const announced = new DownloadReporter({
      file,
      callbacks,
      targetPath,
      totalBytes: file.size ?? 0
    })

    const entry = await remoteDrive.entry(file.path)
    if (!entry?.value?.blob) {
      return announced.failed(`Could not find remote file: ${resolvedName}`)
    }

    const actualBytes = entry.value.blob.byteLength
    if (typeof file.size === 'number' && file.size !== actualBytes) {
      return announced.failed(`Sender claimed ${file.size} bytes but file is ${actualBytes} bytes`)
    }

    const events = new DownloadReporter({
      file,
      callbacks,
      targetPath,
      totalBytes: actualBytes
    })
    events.started()

    const savedTo = await this.writeToDisk(
      remoteDrive,
      file.path,
      targetPath,
      actualBytes,
      (bytesTransferred) => events.progressed(bytesTransferred),
      signal,
      file.overwrite === true
    )

    events.completed(savedTo)
    return { ok: true, savedTo }
  }

  async evictDrive(driveKey: string): Promise<void> {
    const cached = this.remoteDrives.get(driveKey)
    if (!cached) return
    this.remoteDrives.delete(driveKey)
    try {
      await cached.close()
    } catch (err) {
      console.warn('LegacyHyperdrive: failed to close evicted drive', err)
    }
  }

  async closeAll(): Promise<void> {
    const drives = Array.from(this.remoteDrives.values())
    this.remoteDrives.clear()
    for (const drive of drives) {
      try {
        await drive.close()
      } catch (err) {
        console.warn('LegacyHyperdrive: close drive failed', err)
      }
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
        console.warn('LegacyHyperdrive: update on cached drive failed, using cached state', err)
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

  private freeTargetPath(targetPath: string): Promise<string> {
    return firstFreePath(targetPath, async (candidate) => !(await fileExists(candidate)))
  }

  private async writeToDisk(
    remoteDrive: Hyperdrive,
    sourcePath: string,
    targetPath: string,
    totalBytes: number,
    onProgress: (bytesTransferred: number) => void,
    signal?: AbortLike,
    overwrite = false
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
          console.warn('LegacyHyperdrive: failed to delete partial file', partPath, cleanupErr)
        }
      }
      throw err
    } finally {
      release()
    }

    const finalPath = overwrite ? targetPath : await this.freeTargetPath(targetPath)
    await fs.promises.rename(partPath, finalPath)
    return finalPath
  }
}
