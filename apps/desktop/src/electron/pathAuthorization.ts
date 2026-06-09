import { isPathSafe, type DownloadFileRequest, type TransferMethod } from '@altersend/core'

export type PickedPathKind = 'file' | 'directory'
export type PickedPathPurpose = 'share' | 'download'

interface PickedPathEntry {
  path: string
  kind: PickedPathKind
  purpose: PickedPathPurpose
}

export type PickedPathRegistry = Map<number, PickedPathEntry[]>

export function createPickedPathRegistry(): PickedPathRegistry {
  return new Map()
}

export function recordPickedPath(
  registry: PickedPathRegistry,
  senderId: number,
  filePath: string,
  kind: PickedPathKind,
  purpose: PickedPathPurpose
): void {
  const existing = registry.get(senderId)
  if (existing) {
    existing.push({ path: filePath, kind, purpose })
    return
  }
  registry.set(senderId, [{ path: filePath, kind, purpose }])
}

export function isAllowedPath(
  registry: PickedPathRegistry,
  senderId: number,
  filePath: string,
  purpose?: PickedPathPurpose
): boolean {
  const allowed = registry.get(senderId)
  if (!allowed) return false

  const normalizedFilePath = normalizeSeparators(filePath)
  for (const picked of allowed) {
    if (purpose && picked.purpose !== purpose) continue
    if (picked.path === filePath) return true
    if (picked.kind !== 'directory') continue
    const normalizedPickedPath = normalizeSeparators(picked.path).replace(/[\/]+$/, '')
    if (normalizedFilePath.startsWith(`${normalizedPickedPath}/`)) return true
  }
  return false
}

export function assertAuthorizedTransferInvocation(
  registry: PickedPathRegistry,
  senderId: number,
  method: TransferMethod,
  args: unknown[]
): void {
  if (method === 'shareFiles') {
    const paths = args[0]
    if (!Array.isArray(paths)) throw new Error('Refused: shareFiles paths must be an array')
    for (const filePath of paths) {
      if (!isAuthorizedPath(registry, senderId, filePath, 'share')) {
        throw new Error('Refused: shareFiles path not from a user-approved dialog')
      }
    }
    return
  }

  if (method === 'downloadFiles') {
    const files = args[0]
    if (!Array.isArray(files)) throw new Error('Refused: downloadFiles files must be an array')
    for (const file of files) {
      const targetPath = getDownloadTarget(file)
      if (!isAuthorizedPath(registry, senderId, targetPath, 'download')) {
        throw new Error('Refused: downloadFiles target not from a user-approved dialog')
      }
    }
  }
}

function normalizeSeparators(filePath: string): string {
  return filePath.replace(/\\/g, '/')
}

function isAuthorizedPath(
  registry: PickedPathRegistry,
  senderId: number,
  value: unknown,
  purpose: PickedPathPurpose
): value is string {
  return isPathSafe(value) && isAllowedPath(registry, senderId, value, purpose)
}

function getDownloadTarget(file: unknown): string | null {
  if (!file || typeof file !== 'object') return null
  const request = file as Partial<DownloadFileRequest>
  if (typeof request.targetPath === 'string') return request.targetPath
  if (typeof request.targetDir === 'string') return request.targetDir
  return null
}
