import { requireOptionalNativeModule } from 'expo-modules-core'

interface MediaStoreNativeModule {
  saveToDownloads(srcPath: string, fileName: string, mimeType: string): Promise<string>
  openDownload(contentUri: string, mimeType: string): Promise<void>
  openDownloadsFolder(): Promise<void>
}

const nativeModule = requireOptionalNativeModule<MediaStoreNativeModule>('MediaStore')

function requireModule(): MediaStoreNativeModule {
  if (!nativeModule) throw new Error('MediaStore is only available on Android')
  return nativeModule
}

export function isMediaStoreAvailable(): boolean {
  return nativeModule != null
}

/** Streams a local file into the public Downloads collection. Returns the MediaStore content URI. */
export function saveToDownloads(
  srcPath: string,
  fileName: string,
  mimeType: string
): Promise<string> {
  return requireModule().saveToDownloads(srcPath, fileName, mimeType)
}

export function openDownload(contentUri: string, mimeType: string): Promise<void> {
  return requireModule().openDownload(contentUri, mimeType)
}

export function openDownloadsFolder(): Promise<void> {
  return requireModule().openDownloadsFolder()
}
