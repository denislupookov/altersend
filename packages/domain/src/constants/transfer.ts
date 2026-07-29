export const WEB_LINK_MAX_BYTES = 5 * 1024 ** 3

export const WEB_LINK_MAX_LABEL = `${WEB_LINK_MAX_BYTES / 1024 ** 3} GB`

export function exceedsWebLinkLimit(totalSize: number): boolean {
  return totalSize > WEB_LINK_MAX_BYTES
}
