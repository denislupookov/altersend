import type { ReceiveRow } from '@altersend/domain'
import type { DownloadRowLock } from './DownloadRow'
import { LinkRow } from '../LinkRow'
import { ProTag } from '../ProTag'
import { FolderIcon } from '../../icons'
import { useTheme } from '../../theme'

interface LockedRowProps {
  row: ReceiveRow
  lock: DownloadRowLock
  isFirst?: boolean
  compact?: boolean
  standalone?: boolean
}

export function LockedRow({
  row,
  lock,
  isFirst = false,
  compact = false,
  standalone = false
}: LockedRowProps) {
  const { theme } = useTheme()
  const isFile = row.kind === 'file'

  return (
    <LinkRow
      file={isFile}
      icon={isFile ? undefined : <FolderIcon size={16} color={theme.colors.colorTextMuted} />}
      muted
      bare={!standalone}
      standalone={standalone}
      compact={compact}
      isFirst={isFirst}
      label={isFile ? row.offer.name : row.name}
      size={isFile ? row.offer.size : row.totalSize}
      subtitleTone='faint'
      trailing={<ProTag label={lock.tag} accessibleLabel={lock.label} />}
    />
  )
}
