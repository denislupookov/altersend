import { Directory, File, Paths } from 'expo-file-system'
import type { AutoAcceptStoragePort } from '@altersend/domain'

const DIRNAME = 'altersend'
const FILENAME = 'devices.auto-accept'

function markerFile(): File | null {
  const documentDirectory = Paths.document
  if (!documentDirectory?.uri) return null
  return new File(new Directory(documentDirectory, DIRNAME), FILENAME)
}

function isAutoAcceptEnabled(): boolean {
  try {
    return markerFile()?.exists ?? false
  } catch {
    return false
  }
}

function setAutoAcceptEnabled(enabled: boolean): void {
  try {
    const documentDirectory = Paths.document
    if (!documentDirectory?.uri) return
    const dir = new Directory(documentDirectory, DIRNAME)
    const file = new File(dir, FILENAME)
    if (!enabled) {
      if (file.exists) file.delete()
      return
    }
    if (!dir.exists) dir.create({ idempotent: true, intermediates: true })
    if (!file.exists) file.create()
  } catch (err) {
    console.warn('setAutoAcceptEnabled failed', err)
  }
}

export const autoAcceptStoragePort: AutoAcceptStoragePort = {
  read: isAutoAcceptEnabled,
  write: setAutoAcceptEnabled
}
