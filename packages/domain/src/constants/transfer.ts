import { MAX_FILES_PER_TRANSFER } from '@altersend/core'

export const WEB_LINK_MAX_BYTES = 10 * 1024 ** 3

export const WEB_LINK_MAX_LABEL = `${WEB_LINK_MAX_BYTES / 1024 ** 3} GB`

export function exceedsWebLinkLimit(totalSize: number): boolean {
  return totalSize > WEB_LINK_MAX_BYTES
}

export function exceedsFileCountLimit(fileCount: number): boolean {
  return fileCount > MAX_FILES_PER_TRANSFER
}
