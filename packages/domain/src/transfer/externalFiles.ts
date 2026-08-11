import { exceedsFileCountLimit } from '../constants/transfer'
import { mergeSelectedFiles } from '../send/draftModel'
import { whenTransferReady } from './binding'
import { addSelectedFiles, clearSession, continueShare, replaceSelectedFiles } from './commands'
import { transferStore } from './store'
import type { SelectedFile } from '../send/draftTypes'

export type ExternalShareStatus = 'shared' | 'selected' | 'blocked' | 'ignored'

export interface ExternalShareResult {
  status: ExternalShareStatus
}

export function hasActiveSession(): boolean {
  const { role, draftPhase } = transferStore.getState()
  return role !== null || draftPhase === 'preparing'
}

export const receiveExternalFiles = async (
  incoming: SelectedFile[],
  options: { force?: boolean } = {}
): Promise<ExternalShareResult> => {
  if (incoming.length === 0) return { status: 'ignored' }

  const active = hasActiveSession()
  if (active && !options.force) return { status: 'blocked' }
  if (active) await clearSession()

  const draft = transferStore.getState().selectedFiles
  const merged = mergeSelectedFiles(draft, incoming)
  const tooManyFiles = exceedsFileCountLimit(merged.filter((file) => file.kind !== 'text').length)

  if (draft.length > 0) {
    addSelectedFiles(incoming)
    return { status: 'selected' }
  }

  replaceSelectedFiles(incoming)
  if (tooManyFiles) return { status: 'selected' }

  await whenTransferReady()
  await continueShare(incoming)
  return { status: 'shared' }
}
