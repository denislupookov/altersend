export function getDirname(filePath: string) {
  const normalizedPath = filePath.replace(/\\/g, '/')
  const lastSlashIndex = normalizedPath.lastIndexOf('/')

  if (lastSlashIndex <= 0) return '.'
  return normalizedPath.slice(0, lastSlashIndex)
}

export function getFileName(filePath: string) {
  const normalizedPath = filePath.replace(/\\/g, '/')
  return normalizedPath.split('/').pop() || normalizedPath
}

export function withDisplayName(relativePath: string, name: string | undefined) {
  if (!name) return relativePath
  const dir = getDirname(relativePath)
  return dir === '.' ? name : joinFilePath(dir, name)
}

export function joinFilePath(dirPath: string, fileName: string) {
  if (!dirPath) return fileName

  const separator = dirPath.includes('\\') && !dirPath.includes('/') ? '\\' : '/'
  const trailingSeparators = /[\\/]+$/

  return `${dirPath.replace(trailingSeparators, '')}${separator}${fileName}`
}

export function toSafeFileName(name: string, fallback: string): string {
  const sanitized = name
    .replace(/[\\/\0]/g, '_')
    .trim()
    .slice(0, 255)
  return sanitized.length > 0 && sanitized !== '.' && sanitized !== '..' ? sanitized : fallback
}

export function isSafeFileName(name: unknown): name is string {
  if (typeof name !== 'string') return false
  if (name.length === 0 || name.length > 255) return false
  if (name.includes('\0')) return false
  if (name.includes('/') || name.includes('\\')) return false
  if (name === '.' || name === '..') return false
  return true
}

export function isSafeRelativePath(value: unknown): value is string {
  if (typeof value !== 'string') return false
  if (value.length === 0 || value.length > 4096) return false
  if (value.includes('\0')) return false

  if (value.startsWith('/') || value.startsWith('\\')) return false
  if (/^[a-zA-Z]:/.test(value)) return false

  const segments = value.split(/[/\\]/).filter((segment) => segment.length > 0)

  if (segments.length === 0) return false
  for (const segment of segments) {
    if (segment === '.' || segment === '..') return false
    if (segment.length > 255) return false
  }
  return true
}

export function toRelativePath(drivePath: string): string {
  return drivePath.replace(/\\/g, '/').replace(/^\/+/, '')
}

export function shortKey(hex: string | null | undefined): string {
  return hex ? hex.slice(0, 8) : '(none)'
}

const HEX_KEY_RE = /^[0-9a-f]{64}$/i
export const MAX_DISPLAY_NAME_LEN = 256

export function isBoundedString(x: unknown, maxLen: number): x is string {
  return typeof x === 'string' && x.length > 0 && x.length <= maxLen
}

export function isValidHexKey(value: unknown): value is string {
  return typeof value === 'string' && HEX_KEY_RE.test(value)
}

export function isPathSafe(value: unknown): value is string {
  if (typeof value !== 'string' || value.length === 0) return false
  if (value.includes('\0')) return false
  const segments = value.split(/[/\\]/)
  return !segments.includes('..')
}

export class AbortError extends Error {
  constructor(message = 'Operation aborted') {
    super(message)
    this.name = 'AbortError'
  }
}

export interface AbortLike {
  readonly aborted: boolean
  addEventListener(type: 'abort', listener: () => void): void
  removeEventListener(type: 'abort', listener: () => void): void
}

export function onAbort(signal: AbortLike | undefined, abort: () => void): () => void {
  if (!signal) return () => {}
  if (signal.aborted) {
    abort()
    return () => {}
  }
  signal.addEventListener('abort', abort)
  return () => signal.removeEventListener('abort', abort)
}
