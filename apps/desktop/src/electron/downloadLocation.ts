import { app } from 'electron'
import { readFile, stat } from 'fs/promises'
import path from 'path'
import { writeFileViaTemp } from './writeFileViaTemp.js'

interface StoredLocation {
  folder?: string
}

function storePath(): string {
  return path.join(app.getPath('userData'), 'download-location.json')
}

async function isDirectory(target: string): Promise<boolean> {
  try {
    return (await stat(target)).isDirectory()
  } catch {
    return false
  }
}

async function readStored(): Promise<string | null> {
  try {
    const parsed = JSON.parse(await readFile(storePath(), 'utf8')) as StoredLocation
    return typeof parsed.folder === 'string' && parsed.folder.length > 0 ? parsed.folder : null
  } catch {
    return null
  }
}

function osDownloadsDir(): string | null {
  try {
    return app.getPath('downloads')
  } catch {
    return null
  }
}

export async function getDownloadFolder(): Promise<string | null> {
  const saved = await readStored()
  if (saved && (await isDirectory(saved))) return saved

  const fallback = osDownloadsDir()
  return fallback && (await isDirectory(fallback)) ? fallback : null
}

export async function setDownloadFolder(folder: string): Promise<void> {
  await writeFileViaTemp(storePath(), JSON.stringify({ folder } satisfies StoredLocation))
}
