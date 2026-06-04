import type { SenderUploadItem } from './draftTypes'

export function getStatusTone(
  item: Pick<SenderUploadItem, 'status'>
): 'muted' | 'active' | 'success' {
  if (item.status === 'completed') return 'success'
  if (item.status === 'uploading') return 'active'
  return 'muted'
}

export function getProgressState(
  item: Pick<SenderUploadItem, 'status'>
): 'waiting' | 'uploading' | 'completed' {
  if (item.status === 'completed') return 'completed'
  if (item.status === 'uploading') return 'uploading'
  return 'waiting'
}

export function getOverallProgress(items: Pick<SenderUploadItem, 'status'>[]) {
  const completed = items.filter((i) => i.status === 'completed').length
  const total = items.length
  const percent = total > 0 ? Math.round((completed / total) * 100) : 0
  return { completed, total, percent }
}
