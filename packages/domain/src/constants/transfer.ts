import { MAX_FILES_PER_TRANSFER } from '@altersend/core'

export const WEB_LINK_MAX_BYTES = 10 * 1024 ** 3

export const WEB_LINK_MAX_LABEL = `${WEB_LINK_MAX_BYTES / 1024 ** 3} GB`

export const NATIVE_RELAY_MAX_BYTES = 20 * 1024 ** 3

export const NATIVE_RELAY_MAX_LABEL = `${NATIVE_RELAY_MAX_BYTES / 1024 ** 3} GB`

export function exceedsWebLinkLimit(totalSize: number, pro = false): boolean {
  return !pro && totalSize > WEB_LINK_MAX_BYTES
}

export function exceedsFileCountLimit(fileCount: number): boolean {
  return fileCount > MAX_FILES_PER_TRANSFER
}
