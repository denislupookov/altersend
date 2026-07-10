import { Directory, File, Paths } from 'expo-file-system'

const DIRNAME = 'altersend'
const FILENAME = 'relay.disabled'

function getMarkerFile(): File | null {
  const documentDirectory = Paths.document
  if (!documentDirectory?.uri) return null
  return new File(new Directory(documentDirectory, DIRNAME), FILENAME)
}

export function isRelayEnabled(): boolean {
  try {
    return !(getMarkerFile()?.exists ?? false)
  } catch {
    return true
  }
}

export function setRelayEnabledStorage(value: boolean): void {
  try {
    const documentDirectory = Paths.document
    if (!documentDirectory?.uri) return
    const dir = new Directory(documentDirectory, DIRNAME)
    const file = new File(dir, FILENAME)
    if (value) {
      if (file.exists) file.delete()
    } else {
      if (!dir.exists) dir.create({ idempotent: true, intermediates: true })
      if (!file.exists) file.create()
    }
  } catch (err) {
    console.warn('relayStorage: setRelayEnabledStorage failed', err)
  }
}
