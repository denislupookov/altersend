import type Hyperdrive from 'hyperdrive'
import type Localdrive from 'localdrive'
import MirrorDrive from 'mirror-drive'
import b4a from 'b4a'
import { AbortError } from '../utils'
import type { ScannedFile } from '../sender'

export class LegacyPeerStaging {
  private readonly drive: Hyperdrive
  private pending: ScannedFile[] = []
  private running: Promise<void> | null = null

  constructor(drive: Hyperdrive) {
    this.drive = drive
  }

  get driveKey(): string {
    return b4a.toString(this.drive.key, 'hex')
  }

  stagedEntry(sourcePath: string) {
    return this.drive.entry(sourcePath)
  }

  setPendingFiles(files: ScannedFile[]): void {
    this.pending = files
  }

  stage(
    onStaging: (file: ScannedFile) => void,
    onDrained: () => Promise<void>,
    signal?: AbortSignal
  ): Promise<void> {
    if (!this.running) {
      const run: Promise<void> = this.run(onStaging, onDrained, signal).catch((err) => {
        if (this.running === run) this.running = null
        throw err
      })
      this.running = run
    }
    return this.running
  }

  reset(): void {
    this.pending = []
    this.running = null
  }

  private async run(
    onStaging: (file: ScannedFile) => void,
    onDrained: () => Promise<void>,
    signal?: AbortSignal
  ): Promise<void> {
    const files = this.pending
    const superseded = () => this.pending !== files

    try {
      for (const file of files) {
        if (signal?.aborted) throw new AbortError()
        onStaging(file)
        if (!file.alreadyStaged) await this.importToDrive(file.sourceDrive, file.sourcePath)
      }
    } catch (err) {
      if (superseded()) return
      throw err
    }

    if (superseded()) return
    this.pending = []
    await onDrained()
  }

  private async importToDrive(sourceDrive: Localdrive, sourcePath: string): Promise<void> {
    const mirror = new MirrorDrive(sourceDrive, this.drive, {
      entries: [sourcePath],
      prune: false
    })
    await mirror.done()
  }
}
