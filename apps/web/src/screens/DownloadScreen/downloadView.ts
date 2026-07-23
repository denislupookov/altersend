import { formatFileSize, getOfferKey, type DownloadItemState } from '@altersend/domain'
import type { Translate, TransferFile } from '../../types'
import type { DownloadSummary } from './useDownloadSummary'

function toState({ offer, received, status }: TransferFile): DownloadItemState {
  const base = { bytesTransferred: received, totalBytes: offer.size }

  switch (status) {
    case 'completed':
      return {
        ...base,
        status: 'completed',
        bytesTransferred: offer.size,
        destination: 'downloads'
      }
    case 'downloading':
      return { ...base, status: 'downloading', pausable: true }
    case 'paused':
    case 'failed':
      return { ...base, status: 'failed', resumable: true, savedTo: offer.name }
    default:
      return { ...base, status: 'idle', bytesTransferred: 0 }
  }
}

export function toDownloadStates(files: TransferFile[]): Record<string, DownloadItemState> {
  return Object.fromEntries(files.map((file) => [getOfferKey(file.offer), toState(file)]))
}

export function getTitleLabel(t: Translate, summary: DownloadSummary): string {
  if (summary.textCount > 0) {
    return t('common:files.items', { count: summary.count + summary.textCount })
  }
  return t('common:files.count', { count: summary.count })
}

export function getStatusLabel(t: Translate, summary: DownloadSummary): string {
  if (summary.allDownloaded) return t('web:download.allDownloaded')
  return t('web:download.connected')
}

export function getMetaLabel(t: Translate, summary: DownloadSummary): string {
  if (summary.count === 0) return t('common:files.texts', { count: summary.textCount })

  const size = formatFileSize(summary.totals.totalBytes)

  if (summary.allDownloaded) return t('web:download.complete', { size })
  if (summary.isDownloading) {
    return t('receive:summary.receivedProgress', {
      completed: summary.totals.completedCount,
      count: summary.count
    })
  }
  return t('receive:page.incomingTransfer.description', { count: summary.count, size })
}

export function getHintLabel(t: Translate, summary: DownloadSummary): string {
  if (summary.allDownloaded) {
    return t('web:download.savedToDownloads', {
      files: t('common:files.count', { count: summary.count })
    })
  }
  if (summary.isDownloading) return t('web:download.keepTabOpen')
  return t('web:download.saveHint')
}
