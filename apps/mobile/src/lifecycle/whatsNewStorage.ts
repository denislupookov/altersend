import { Directory, File, Paths } from 'expo-file-system'
import type { WhatsNewStorage } from '@altersend/domain'

const DIRNAME = 'altersend'
const FILENAME = 'whats-new.version'

function getMarkerFile(): File | null {
  const documentDirectory = Paths.document
  if (!documentDirectory?.uri) return null
  return new File(new Directory(documentDirectory, DIRNAME), FILENAME)
}

function getLastSeenRelease(): string | null {
  try {
    const file = getMarkerFile()
    if (!file?.exists) return null
    const version = file.textSync().trim()
    return version.length > 0 ? version : null
  } catch {
    return null
  }
}

function markReleaseSeen(version: string): void {
  try {
    const documentDirectory = Paths.document
    if (!documentDirectory?.uri) return
    const dir = new Directory(documentDirectory, DIRNAME)
    if (!dir.exists) dir.create({ idempotent: true, intermediates: true })
    new File(dir, FILENAME).write(version)
  } catch (err) {
    console.warn('whatsNewStorage: markReleaseSeen failed', err)
  }
}

export const whatsNewStorage: WhatsNewStorage = {
  readLastSeen: getLastSeenRelease,
  writeLastSeen: markReleaseSeen
}
