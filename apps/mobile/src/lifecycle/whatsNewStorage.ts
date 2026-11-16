import { Directory, File, Paths } from 'expo-file-system'
import type { WhatsNewStorage } from '@altersend/domain'

const DIRNAME = 'altersend'
const SEEN_FILENAME = 'whats-new.version'
const RATED_FILENAME = 'whats-new.rated'

function markerDirectory(): Directory | null {
  const documentDirectory = Paths.document
  if (!documentDirectory?.uri) return null
  return new Directory(documentDirectory, DIRNAME)
}

function readMarker(filename: string): string | null {
  try {
    const dir = markerDirectory()
    if (!dir) return null
    const file = new File(dir, filename)
    if (!file.exists) return null
    const value = file.textSync().trim()
    return value.length > 0 ? value : null
  } catch {
    return null
  }
}

function writeMarker(filename: string, value: string): void {
  try {
    const dir = markerDirectory()
    if (!dir) return
    if (!dir.exists) dir.create({ idempotent: true, intermediates: true })
    new File(dir, filename).write(value)
  } catch (err) {
    console.warn(`whatsNewStorage: writing ${filename} failed`, err)
  }
}

export const whatsNewStorage: WhatsNewStorage = {
  readLastSeen: () => readMarker(SEEN_FILENAME),
  writeLastSeen: (version) => writeMarker(SEEN_FILENAME, version)
}

export function readRatedDay(): string | null {
  return readMarker(RATED_FILENAME)
}

export function writeRatedDay(day: string): void {
  writeMarker(RATED_FILENAME, day)
}
