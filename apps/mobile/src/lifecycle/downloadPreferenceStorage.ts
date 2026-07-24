import { Platform } from 'react-native'
import { Directory, File, Paths } from 'expo-file-system'

const DIRNAME = 'altersend'
const FILENAME = 'media-to-photos.disabled'

export const MEDIA_DESTINATION_KEYS =
  Platform.OS === 'android'
    ? ({
        label: 'settings:downloads.mediaToGalleryLabel',
        description: 'settings:downloads.mediaToGalleryDescription',
        whenOn: 'settings:downloads.destinationGallery',
        whenOff: 'settings:downloads.destinationDownloads'
      } as const)
    : ({
        label: 'settings:downloads.mediaToPhotosLabel',
        description: 'settings:downloads.mediaToPhotosDescription',
        whenOn: 'settings:downloads.destinationPhotos',
        whenOff: 'settings:downloads.destinationFiles'
      } as const)

function getMarkerFile(): File | null {
  const documentDirectory = Paths.document
  if (!documentDirectory?.uri) return null
  return new File(new Directory(documentDirectory, DIRNAME), FILENAME)
}

export function isSaveMediaToPhotos(): boolean {
  try {
    return !(getMarkerFile()?.exists ?? false)
  } catch {
    return true
  }
}

export function setSaveMediaToPhotos(value: boolean): boolean {
  try {
    const documentDirectory = Paths.document
    if (!documentDirectory?.uri) return false
    const dir = new Directory(documentDirectory, DIRNAME)
    const file = new File(dir, FILENAME)
    if (value) {
      if (file.exists) file.delete()
    } else {
      if (!dir.exists) dir.create({ idempotent: true, intermediates: true })
      if (!file.exists) file.create()
    }
    return true
  } catch (err) {
    console.warn('downloadPreferenceStorage: setSaveMediaToPhotos failed', err)
    return false
  }
}
