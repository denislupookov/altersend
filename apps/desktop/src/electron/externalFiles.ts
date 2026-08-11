import fs, { existsSync } from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { expandPaths } from './fileScan.js'
import { isUnder, recordPickedPath } from './pathAccess.js'
import { shareContainerDir } from './shareExtension.js'

const BATCH_DELAY_MS = 120

let pendingPaths: string[] = []
let batchTimer: NodeJS.Timeout | null = null
let queued: PickedFile[] = []
let target: Electron.WebContents | null = null

function toLocalPath(arg: string): string | null {
  if (!arg.startsWith('file://')) return arg
  try {
    return fileURLToPath(arg)
  } catch {
    return null
  }
}

export function extractFilePaths(
  args: string[],
  protocol: string,
  appPath: string | null
): string[] {
  const paths: string[] = []
  for (const arg of args) {
    if (arg.startsWith('-')) continue
    if (arg.startsWith(`${protocol}://`)) continue

    const local = toLocalPath(arg)
    if (!local) continue

    const resolved = path.resolve(local)
    if (appPath && isUnder(resolved, appPath)) continue
    if (!existsSync(resolved)) continue

    paths.push(resolved)
  }
  return paths
}

export function readShareManifest(rawUrl: string, containerDir = shareContainerDir()): string[] {
  let parsed: URL
  try {
    parsed = new URL(rawUrl)
  } catch {
    return []
  }

  if (parsed.host !== 'share') return []
  const manifest = parsed.searchParams.get('manifest')
  if (!manifest) return []

  let resolved: string
  let root: string
  try {
    resolved = fs.realpathSync(manifest)
    root = fs.realpathSync(containerDir)
  } catch {
    return []
  }

  if (!isUnder(resolved, root)) {
    console.error('externalFiles: refused share manifest outside the extension container')
    return []
  }

  try {
    const entries: unknown = JSON.parse(fs.readFileSync(resolved, 'utf-8'))
    if (!Array.isArray(entries)) return []
    return entries.filter((entry): entry is string => typeof entry === 'string')
  } catch (err) {
    console.error('externalFiles: failed to read share manifest', err)
    return []
  } finally {
    fs.rmSync(resolved, { force: true })
  }
}

export function enqueueExternalPaths(paths: string[]): void {
  if (paths.length === 0) return
  pendingPaths.push(...paths)

  if (batchTimer) clearTimeout(batchTimer)
  batchTimer = setTimeout(() => {
    batchTimer = null
    resolvePending().catch((err) =>
      console.error('externalFiles: failed to read shared paths', err)
    )
  }, BATCH_DELAY_MS)
}

async function resolvePending(): Promise<void> {
  const paths = pendingPaths
  pendingPaths = []

  queued.push(...(await expandPaths(paths)))
  flush()
}

export function takeQueuedExternalFiles(webContents: Electron.WebContents): PickedFile[] {
  if (target !== webContents) {
    target = webContents
    webContents.once('destroyed', () => {
      if (target === webContents) target = null
    })
  }
  return drain(webContents)
}

function drain(webContents: Electron.WebContents): PickedFile[] {
  const files = queued
  queued = []
  for (const file of files) recordPickedPath(webContents.id, file.path)
  return files
}

function flush(): void {
  if (!target || target.isDestroyed() || queued.length === 0) return
  target.send('app:external-files', drain(target))
}
