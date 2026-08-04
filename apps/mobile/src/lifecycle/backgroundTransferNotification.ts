import {
  countSharedFiles,
  formatFileSize,
  formatItemsCount,
  formatTransferRate,
  getTransferRate,
  type DownloadItemState,
  type RateSample,
  type SenderUploadItem,
  type TransferActivity
} from '@altersend/domain'
import { translate } from '@altersend/locales'
import {
  INDETERMINATE_PROGRESS,
  type TransferNotificationContent
} from '@/modules/transfer-service'

export interface CompletionNotification {
  title: string
  text: string
}

export function getChannelName(): string {
  return translate('common:backgroundTransfer.channelName')
}

function describeItems(files: number, texts: number, bytes: number): string {
  const label = formatItemsCount(files, texts, translate)
  return bytes > 0 ? `${label} · ${formatFileSize(bytes)}` : label
}

export function buildSentNotification(
  device: string | undefined,
  items: SenderUploadItem[]
): CompletionNotification {
  const files = countSharedFiles(items)
  const texts = items.length - files
  const bytes = items.reduce((sum, item) => sum + (item.size ?? 0), 0)

  return {
    title: translate('common:backgroundTransfer.sentTo', {
      device: device ?? translate('common:backgroundTransfer.someDevice')
    }),
    text: describeItems(files, texts, bytes)
  }
}

export function buildReceivedNotification(
  states: Record<string, DownloadItemState>,
  bytes: number
): CompletionNotification {
  const saved = Object.values(states).filter((item) => item.status === 'completed').length
  return {
    title: translate('common:backgroundTransfer.received'),
    text: describeItems(saved, 0, bytes)
  }
}

function getTitle(activity: TransferActivity): string {
  if (activity.phase === 'preparing') return translate('common:backgroundTransfer.preparing')
  if (activity.role === 'sender') return translate('common:backgroundTransfer.sending')
  return translate('common:backgroundTransfer.receiving')
}

function getWaitingText(activity: TransferActivity): string {
  if (activity.receivedPeers.length > 0) {
    return translate('common:backgroundTransfer.devicesReceived', {
      count: activity.receivedPeers.length
    })
  }
  if (activity.deviceCount > 0) {
    return translate('common:backgroundTransfer.devicesConnected', { count: activity.deviceCount })
  }
  return translate('common:backgroundTransfer.waiting')
}

export function buildTransferNotification(
  activity: TransferActivity,
  samples: RateSample[]
): TransferNotificationContent {
  const title = getTitle(activity)

  if (activity.phase === 'preparing') {
    return { title, text: '', subText: '', progress: INDETERMINATE_PROGRESS }
  }

  if (activity.phase === 'waiting') {
    return { title, text: getWaitingText(activity), subText: '', progress: INDETERMINATE_PROGRESS }
  }

  const rate = getTransferRate(samples, {
    bytesTransferred: activity.bytesTransferred,
    totalBytes: activity.totalBytes
  })

  return {
    title,
    text: translate('common:backgroundTransfer.progress', {
      percent: activity.percent,
      transferred: formatFileSize(activity.bytesTransferred),
      total: formatFileSize(activity.totalBytes)
    }),
    subText: formatTransferRate(rate, translate) ?? '',
    progress: activity.percent
  }
}
