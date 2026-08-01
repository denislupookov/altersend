import { appStoreUrl, downloadUrl, playStoreUrl } from '@altersend/domain'
import { platform, type OS } from './platform'

const STORE_URL: Partial<Record<OS, string>> = {
  ios: appStoreUrl,
  android: playStoreUrl
}

export function openDownload(): void {
  const url = STORE_URL[platform.os] ?? downloadUrl
  window.open(url, '_blank', 'noopener,noreferrer')
}
