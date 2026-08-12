import { isPairUrl } from '@altersend/domain'
import { getShareExtensionKey } from 'expo-share-intent'

const JOIN_PATH = /(?:\/join\/|\/r[/#])[a-fA-F0-9]{64}/

export function redirectSystemPath({ path }: { path: string; initial: boolean }): string | null {
  try {
    if (path.includes(`dataUrl=${getShareExtensionKey()}`)) {
      return '/'
    }
    if (isPairUrl(path)) {
      return null
    }
    if (JOIN_PATH.test(path)) {
      return '/receive'
    }
    return path
  } catch {
    return '/'
  }
}
