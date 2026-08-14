import {
  receiveFile,
  discardPartial,
  firstFreePath,
  type Bitmap,
  type DriveChannel
} from '@altersend/drive'
import {
  type AbortLike,
  getDirname,
  getFileName,
  isPathSafe,
  isSafeRelativePath,
  joinFilePath,
  onAbort,
  toRelativePath,
  withDisplayName
} from './utils'
import { fileExists } from './fs-utils'
import type { DownloadFileRequest, DownloadFileResult } from '../rpc/protocol'
import {
  DownloadReporter,
  type DownloaderCallbacks,
  type DownloadFileOutcome
} from './download-events'

interface PartialDownload {
  finalPath: string
  bitmap?: Bitmap
  received: number
  overwrite?: boolean
}

function toMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error)
}

export class TransferReceiver {
  private readonly partials = new Map<string, PartialDownload>()
  private readonly active = new Map<string, AbortController>()
  private readonly queued = new Set<string>()
  private readonly paused = new Set<string>()

  async downloadFiles(
    files: DownloadFileRequest[],
    callbacks: DownloaderCallbacks,
    driveFor: (file: DownloadFileRequest) => Promise<DriveChannel>,
    signal?: AbortLike
  ): Promise<DownloadFileResult[]> {
    const results: DownloadFileResult[] = []
    for (const file of files) {
      this.paused.delete(file.fileId)
      this.queued.add(file.fileId)
    }

    for (const file of files) {
      this.queued.delete(file.fileId)
      const resolvedName = file.name ?? getFileName(file.path)
      const record = (outcome: DownloadFileOutcome) =>
        results.push({ fileId: file.fileId, fileName: resolvedName, ...outcome })
      const fail = (targetPath: string, message: string) =>
        record(
          new DownloadReporter({
            file,
            callbacks,
            targetPath,
            totalBytes: file.size ?? 0
          }).failed(message)
        )

      if (signal?.aborted || this.paused.has(file.fileId)) {
        this.paused.delete(file.fileId)
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

      const relativeSaveTarget = withDisplayName(relativeTarget, file.name)
      const targetPath = file.targetPath ?? joinFilePath(file.targetDir!, relativeSaveTarget)

      if (this.active.has(file.fileId)) {
        fail(targetPath, 'Already downloading this file')
        continue
      }

      const perFile = new AbortController()
      this.active.set(file.fileId, perFile)
      const releaseOuter = onAbort(signal, () => perFile.abort())

      try {
        const channel = await driveFor(file)
        record(await this.downloadViaDrive(file, targetPath, callbacks, channel, perFile.signal))
      } catch (error) {
        const cancelled = error instanceof Error && error.name === 'AbortError'

        record(
          new DownloadReporter({
            file,
            callbacks,
            targetPath,
            totalBytes: file.size ?? 0
          }).failed(cancelled ? 'Cancelled' : toMessage(error), { cancelled })
        )
      } finally {
        releaseOuter()
        this.active.delete(file.fileId)
      }
    }

    for (const file of files) this.queued.delete(file.fileId)
    return results
  }

  private async downloadViaDrive(
    file: DownloadFileRequest,
    targetPath: string,
    callbacks: DownloaderCallbacks,
    channel: DriveChannel,
    signal?: AbortLike
  ): Promise<DownloadFileOutcome> {
    const partial = await this.findResumablePartial(file.fileId, targetPath)
    try {
      const overwrite = partial ? partial.overwrite === true : file.overwrite === true
      const finalPath =
        partial?.finalPath ?? (overwrite ? targetPath : await this.availableTargetPath(targetPath))
      const events = new DownloadReporter({
        file,
        callbacks,
        targetPath: finalPath,
        totalBytes: file.size ?? 0,
        pausable: true
      })
      const progress: PartialDownload = {
        finalPath,
        bitmap: partial?.bitmap,
        received: partial?.received ?? 0,
        overwrite
      }
      this.partials.set(file.fileId, progress)

      if (!partial) await discardPartial(finalPath)

      const pending = receiveFile(finalPath, channel, {
        transferId: file.fileId,
        expectedSize: file.size,
        signal,
        overwrite,
        resumeBits: partial?.bitmap?.serialize(),
        onProgress: (bytesTransferred) => events.progressed(bytesTransferred),
        onChunkWritten: (bitmap) => {
          progress.bitmap = bitmap
          progress.received = bitmap.count()
        }
      })

      events.started()
      try {
        const savedTo = await pending
        this.partials.delete(file.fileId)
        events.completed(savedTo)
        return { ok: true, savedTo }
      } catch (err) {
        const corrupt = err instanceof Error && err.name === 'IntegrityError'
        if (corrupt) await this.discardPartials([file.fileId])
        return events.failed(toMessage(err), {
          resumable: !corrupt && (this.partials.get(file.fileId)?.received ?? 0) > 0,
          cancelled: this.paused.delete(file.fileId)
        })
      }
    } finally {
      channel.close()
    }
  }

  private async findResumablePartial(
    fileId: string,
    targetPath: string
  ): Promise<PartialDownload | null> {
    const partial = this.partials.get(fileId)
    if (!partial) return null
    const stale =
      partial.received === 0 ||
      getDirname(partial.finalPath) !== getDirname(targetPath) ||
      !(await fileExists(`${partial.finalPath}.part`))
    if (stale) {
      await this.discardPartials([fileId])
      return null
    }
    return partial
  }

  activeDownloadIds(): string[] {
    return Array.from(this.active.keys())
  }

  pause(fileId: string): boolean {
    const controller = this.active.get(fileId)
    if (controller) {
      this.paused.add(fileId)
      controller.abort()
      return true
    }
    if (!this.queued.has(fileId)) return false
    this.paused.add(fileId)
    return true
  }

  async discardPartials(fileIds?: string[]): Promise<void> {
    const ids = fileIds ?? Array.from(this.partials.keys())
    for (const id of ids) {
      const partial = this.partials.get(id)
      if (!partial) continue
      this.partials.delete(id)
      await discardPartial(partial.finalPath)
    }
  }

  async reset(): Promise<void> {
    this.queued.clear()
    this.paused.clear()
    await this.discardPartials()
  }

  async destroy(): Promise<void> {
    await this.reset()
  }

  private isTargetInUse(targetPath: string): boolean {
    for (const partial of this.partials.values()) {
      if (partial.finalPath === targetPath) return true
    }
    return false
  }

  private availableTargetPath(targetPath: string): Promise<string> {
    return firstFreePath(targetPath, (candidate) => !this.isTargetInUse(candidate))
  }
}
