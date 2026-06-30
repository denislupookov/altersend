import type { RendererTransferEvent } from '@altersend/core'
import type { SendDraftPhase } from './pageUi'
import type { BrowserFileLike, SelectedFile, SenderUploadItem } from './draftTypes'

export interface SharingStatusEvent extends Extract<RendererTransferEvent, { type: 'status' }> {
  state: 'sharing'
  file?: string
  path?: string
}

export function getPhaseFromSelection(fileCount: number): SendDraftPhase {
  return fileCount > 0 ? 'selected' : 'empty'
}

export function mergeSelectedFiles(
  current: SelectedFile[],
  nextSelectedFiles: SelectedFile[]
): SelectedFile[] {
  const merged = new Map(current.map((file) => [file.path, file]))
  for (const file of nextSelectedFiles) merged.set(file.path, file)
  return Array.from(merged.values())
}

export function normalizeSelectedFiles(
  filesOrData: Array<File | BrowserFileLike>,
  getPathForFile: (file: File) => string
): SelectedFile[] {
  return filesOrData.flatMap((fileOrData): SelectedFile[] => {
    if ('path' in fileOrData && fileOrData.path) {
      return [
        {
          name: fileOrData.name,
          path: fileOrData.path,
          size: fileOrData.size,
          relativePath: fileOrData.relativePath
        }
      ]
    }

    if (fileOrData instanceof File) {
      const filePath = getPathForFile(fileOrData)
      if (!filePath) return []

      return [{ name: fileOrData.name, path: filePath, size: fileOrData.size }]
    }

    return []
  })
}

export interface SelectedFileRow {
  kind: 'file'
  file: SelectedFile
}

export interface SelectedFolderRow {
  kind: 'folder'
  name: string
  files: SelectedFile[]
  totalSize: number
}

export type SelectedRow = SelectedFileRow | SelectedFolderRow

export function groupSelectedFiles(files: SelectedFile[]): SelectedRow[] {
  const rows: SelectedRow[] = []
  const folderRowIndex = new Map<string, number>()

  for (const file of files) {
    const relativePath = (file.relativePath ?? '').replace(/\\/g, '/')
    const segments = relativePath.split('/').filter(Boolean)
    if (segments.length <= 1) {
      rows.push({ kind: 'file', file })
      continue
    }

    const name = segments[0]

    const normalizedPath = file.path.replace(/\\/g, '/')
    const key = normalizedPath.endsWith(relativePath)
      ? normalizedPath.slice(0, normalizedPath.length - relativePath.length) + name
      : name

    const existing = folderRowIndex.get(key)
    if (existing === undefined) {
      folderRowIndex.set(key, rows.length)
      rows.push({ kind: 'folder', name, files: [file], totalSize: file.size ?? 0 })
    } else {
      const row = rows[existing] as SelectedFolderRow
      row.files.push(file)
      row.totalSize += file.size ?? 0
    }
  }

  return rows
}

export function createInitialUploadItems(selectedFiles: SelectedFile[]): SenderUploadItem[] {
  return selectedFiles.map((file) => ({
    ...file,
    status: 'waiting' as const
  }))
}

export function applySharingProgress(
  current: SenderUploadItem[],
  message: SharingStatusEvent
): SenderUploadItem[] {
  if (current.length === 0) return current

  const activePath = typeof message.path === 'string' ? message.path : undefined

  const targetIndex = activePath
    ? current.findIndex((item) => item.path === activePath)
    : current.findIndex((item) => item.name === message.file && item.status !== 'completed')

  if (targetIndex === -1) return current

  return current.map((item, index) => {
    if (index < targetIndex) {
      return item.status === 'completed' ? item : { ...item, status: 'completed' }
    }

    if (index === targetIndex) {
      return item.status === 'uploading' ? item : { ...item, status: 'uploading' }
    }

    return item.status === 'completed' ? item : { ...item, status: 'waiting' }
  })
}
