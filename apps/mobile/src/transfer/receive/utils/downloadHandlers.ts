import { Platform } from 'react-native'
import { File } from 'expo-file-system'
import { Asset, requestPermissionsAsync } from 'expo-media-library'
import type { SaveDestination } from '@altersend/domain'
import { isMediaStoreAvailable, saveToDownloads } from '@/modules/media-store'
import { isSaveMediaToPhotos } from '@/src/lifecycle/downloadPreferenceStorage'

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
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  gif: 'image/gif',
  heic: 'image/heic',
  heif: 'image/heif',
  webp: 'image/webp',
  bmp: 'image/bmp',
  tiff: 'image/tiff',
  tif: 'image/tiff',
  mov: 'video/quicktime',
  mp4: 'video/mp4',
  m4v: 'video/x-m4v',
  '3gp': 'video/3gpp',
  avi: 'video/x-msvideo',
  mkv: 'video/x-matroska',
  webm: 'video/webm',
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

async function saveToFiles(
  localPath: string,
  fileName: string
): Promise<HandleDownloadedFileResult> {
  if (Platform.OS === 'android' && isMediaStoreAvailable()) {
    try {
      const contentUri = await saveToDownloads(localPath, fileName, guessMimeType(fileName))
      return { intended: 'downloads', destination: 'downloads', localPath: contentUri }
    } catch (err) {
      console.warn('saveToFiles: saveToDownloads failed, keeping private copy', err)
      return { intended: 'downloads', destination: 'filesystem', localPath }
    }
  }
  return { intended: 'filesystem', destination: 'filesystem', localPath }
}

export async function handleDownloadedFile(
  localPath: string,
  fileName: string
): Promise<HandleDownloadedFileResult> {
  if (!isMediaFile(fileName) || !isSaveMediaToPhotos()) {
    return saveToFiles(localPath, fileName)
  }

  const permission = await requestPermissionsAsync(true)
  if (!permission.granted) {
    return { intended: 'photos', destination: 'filesystem', localPath }
  }
  let created = true
  try {
    await Asset.create(toFilePath(localPath))
  } catch (err) {
    created = false
    console.warn('handleDownloadedFile: media library save failed', err)
  }

  try {
    const original = new File(localPath)
    if (created && original.exists) original.delete()
  } catch (err) {
    console.warn('handleDownloadedFile: could not remove the private copy', err)
  }

  return { intended: 'photos', destination: 'photos', localPath }
}
