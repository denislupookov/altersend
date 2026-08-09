import { app } from 'electron'
import { stat } from 'fs/promises'
import { createJsonStore } from './createJsonStore.js'

interface StoredLocation {
  folder: string | null
}

const store = createJsonStore<StoredLocation>('download-location.json', { folder: null })

async function isDirectory(target: string): Promise<boolean> {
  try {
    return (await stat(target)).isDirectory()
  } catch {
    return false
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
  const { folder } = await store.read()
  if (folder && (await isDirectory(folder))) return folder

  const fallback = osDownloadsDir()
  return fallback && (await isDirectory(fallback)) ? fallback : null
}

export function setDownloadFolder(folder: string): Promise<void> {
  return store.write({ folder })
}
