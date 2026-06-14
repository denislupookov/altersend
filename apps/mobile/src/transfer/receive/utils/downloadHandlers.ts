import { Platform } from 'react-native'
import * as MediaLibrary from 'expo-media-library'
import type { SaveDestination } from '@altersend/domain'
import { isMediaStoreAvailable, saveToDownloads } from '@/modules/media-store'

const IMAGE_EXTENSIONS = new Set([
  'jpg',
  'jpeg',
  'png',
  'gif',
  'heic',
  'heif',
  'webp',
  'bmp',
  'tiff',
  'tif'
])
const VIDEO_EXTENSIONS = new Set(['mov', 'mp4', 'm4v', '3gp', 'avi', 'mkv', 'webm'])

function getExtension(name: string): string {
  const dot = name.lastIndexOf('.')
  if (dot === -1 || dot === name.length - 1) return ''
  return name.slice(dot + 1).toLowerCase()
}

function isMediaFile(fileName: string): boolean {
  const ext = getExtension(fileName)
  return IMAGE_EXTENSIONS.has(ext) || VIDEO_EXTENSIONS.has(ext)
}

const MIME_BY_EXT: Record<string, string> = {
  pdf: 'application/pdf',
  zip: 'application/zip',
  rar: 'application/vnd.rar',
  '7z': 'application/x-7z-compressed',
  gz: 'application/gzip',
  tar: 'application/x-tar',
  doc: 'application/msword',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  xls: 'application/vnd.ms-excel',
  xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  ppt: 'application/vnd.ms-powerpoint',
  pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  txt: 'text/plain',
  csv: 'text/csv',
  json: 'application/json',
  mp3: 'audio/mpeg',
  wav: 'audio/wav',
  apk: 'application/vnd.android.package-archive'
}

export function guessMimeType(fileName: string): string {
  return MIME_BY_EXT[getExtension(fileName)] ?? 'application/octet-stream'
}

function toFilePath(uri: string): string {
  if (uri.startsWith('file://')) return uri
  return `file://${uri}`
}

export interface HandleDownloadedFileResult {
  intended: SaveDestination
  destination: SaveDestination
  localPath: string
}

export async function handleDownloadedFile(
  localPath: string,
  fileName: string
): Promise<HandleDownloadedFileResult> {
  if (!isMediaFile(fileName)) {
    // Android: stream into the public Downloads collection so it's browsable in Files.
    // iOS exposes the app's Documents dir via the Files app already, so no export is needed.
    if (Platform.OS === 'android' && isMediaStoreAvailable()) {
      try {
        const contentUri = await saveToDownloads(localPath, fileName, guessMimeType(fileName))
        return { intended: 'downloads', destination: 'downloads', localPath: contentUri }
      } catch (err) {
        console.warn('handleDownloadedFile: saveToDownloads failed, keeping private copy', err)
        return { intended: 'downloads', destination: 'filesystem', localPath }
      }
    }
    return { intended: 'filesystem', destination: 'filesystem', localPath }
  }

  const permission = await MediaLibrary.requestPermissionsAsync(true)
  if (!permission.granted) {
    return { intended: 'photos', destination: 'filesystem', localPath }
  }
  await MediaLibrary.saveToLibraryAsync(toFilePath(localPath))
  return { intended: 'photos', destination: 'photos', localPath }
}
