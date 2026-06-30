export interface SelectedFile {
  name: string
  path: string
  size?: number
  isTemporary?: boolean
  kind?: 'file' | 'text'
  content?: string
  relativePath?: string
}

export type SenderUploadStatus = 'waiting' | 'uploading' | 'completed'

export interface SenderUploadItem extends SelectedFile {
  status: SenderUploadStatus
}

export interface BrowserFileLike {
  name: string
  path?: string
  size?: number
  relativePath?: string
}
