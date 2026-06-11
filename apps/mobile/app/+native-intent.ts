import { getShareExtensionKey } from 'expo-share-intent'

const JOIN_PATH = /(?:^|\/)join\/[a-fA-F0-9]{64}/

export function redirectSystemPath({ path }: { path: string; initial: boolean }) {
  try {
    if (path.includes(`dataUrl=${getShareExtensionKey()}`)) {
      return '/'
    }
    if (JOIN_PATH.test(path)) {
      return '/receive'
    }
    return path
  } catch {
    return '/'
  }
}
