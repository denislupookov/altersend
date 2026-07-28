export const WEB_LINK_MAX_BYTES = 5 * 1024 ** 3

export function exceedsWebLinkLimit(totalSize: number): boolean {
  return totalSize > WEB_LINK_MAX_BYTES
}
