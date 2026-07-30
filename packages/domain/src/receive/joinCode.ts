import { webAppUrl } from '../constants/links'
import { formatFileSize, formatItemsCount } from '../format'
import type { Translate } from '../i18n'

export const JOIN_CODE_PATTERN = /^[a-fA-F0-9]{64}$/

export const JOIN_URL_SCHEME = 'altersend'

export function buildJoinUrl(topic: string): string {
  return `${JOIN_URL_SCHEME}://join/${topic}`
}

export function buildWebReceiveUrl(topic: string, baseUrl: string = webAppUrl): string {
  const base = (baseUrl || webAppUrl).replace(/\/+$/, '')
  return `${base}/r#${topic}`
}

export function buildPairUrl(topic: string): string {
  return `${JOIN_URL_SCHEME}://pair/${topic}`
}

export function isPairUrl(value: string): boolean {
  return value.includes('://pair/')
}

export function isValidJoinCode(value: string): boolean {
  return JOIN_CODE_PATTERN.test(value.trim())
}

export function extractJoinCode(value: string): string | null {
  const trimmedValue = value.trim()

  if (!trimmedValue) {
    return null
  }

  const match = trimmedValue.match(/[a-fA-F0-9]{64}/)

  return match ? match[0].toLowerCase() : null
}

export interface ShareInviteInput {
  link: string
  fileCount: number
  textCount: number
  totalSize: number
}

export function buildShareInvite(t: Translate, input: ShareInviteInput): string {
  const items = formatItemsCount(input.fileCount, input.textCount, t)
  const summary = input.totalSize > 0 ? `${items} (${formatFileSize(input.totalSize)})` : items
  return t('send:connection.shareMessage', { items: summary, link: input.link })
}
