import type { Translate } from './i18n'

export type InviteStatus = 'inviting' | 'sent' | 'offline'

export function formatItemsCount(fileCount: number, textCount: number, t: Translate): string {
  if (fileCount > 0 && textCount > 0)
    return t('common:files.items', { count: fileCount + textCount })
  if (textCount > 0) return t('common:files.texts', { count: textCount })
  return t('common:files.count', { count: fileCount })
}

export function formatSendButtonLabel(fileCount: number, textCount: number, t: Translate): string {
  if (fileCount > 0 && textCount > 0)
    return t('send:actions.sendItems', { count: fileCount + textCount })
  if (textCount > 0) return t('send:actions.sendTexts', { count: textCount })
  return t('send:actions.sendFiles', { count: fileCount })
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 ** 2) return `${(bytes / 1024).toFixed(1)} KB`
  if (bytes < 1024 ** 3) return `${(bytes / 1024 ** 2).toFixed(1)} MB`
  return `${(bytes / 1024 ** 3).toFixed(1)} GB`
}

export function formatRelativeTime(timestamp: number, now: number = Date.now()): string {
  const diff = Math.max(0, now - timestamp)
  const minutes = Math.floor(diff / 60_000)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)

  if (minutes < 1) return 'just now'
  if (minutes < 60) return `${minutes} min ago`
  if (hours < 24) return `${hours} ${hours === 1 ? 'hour' : 'hours'} ago`
  return `${days} ${days === 1 ? 'day' : 'days'} ago`
}
