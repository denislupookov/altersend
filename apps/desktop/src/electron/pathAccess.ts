import path from 'path'
import { isPathSafe } from '@altersend/core'
import { getDownloadFolder } from './store/index.js'

const pickedPaths = new Map<number, Set<string>>()

export function recordPickedPath(senderId: number, filePath: string): void {
  if (!pickedPaths.has(senderId)) pickedPaths.set(senderId, new Set())
  pickedPaths.get(senderId)!.add(filePath)
}

export function forgetPickedPaths(senderId: number): void {
  pickedPaths.delete(senderId)
}

export function isUnder(filePath: string, dir: string): boolean {
  const rel = path.relative(dir, filePath)
  if (rel === '') return true
  if (path.isAbsolute(rel)) return false
  return rel !== '..' && !rel.startsWith(`..${path.sep}`)
}

async function isAllowedPath(senderId: number, filePath: string): Promise<boolean> {
  for (const p of pickedPaths.get(senderId) ?? []) {
    if (isUnder(filePath, p)) return true
  }

  const folder = await getDownloadFolder()
  return folder ? isUnder(filePath, folder) : false
}

export async function assertAllowedPath(
  evt: Electron.IpcMainInvokeEvent,
  filePath: string
): Promise<void> {
  if (!isPathSafe(filePath)) throw new Error('Refused: path failed safety check')
  if (!(await isAllowedPath(evt.sender.id, filePath))) {
    throw new Error('Refused: path not from a user-approved dialog')
  }
}
