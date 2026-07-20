import { useState } from 'react'
import { html } from 'react-strict-dom'
import {
  getDownloadRowAction,
  getDownloadRowDisplay,
  getFolderRowAction,
  getFolderRowDisplay,
  getOfferKey,
  type DownloadItemState,
  type DownloadRowDisplay,
  type DownloadRowAction,
  type DownloadRowLabels,
  type ReceiveRow
} from '@altersend/domain'
import type { IncomingFileOffer } from '@altersend/core'
import { LinkRow } from '../LinkRow'
import { ChevronRightIcon, FolderIcon } from '../../icons'
import { useTheme } from '../../theme'
import { RowActionButton } from './RowActionButton'
import { styles } from './styles'

type FileOffer = Extract<IncomingFileOffer, { kind: 'file' }>

export function rowKey(row: ReceiveRow): string {
  return row.kind === 'file' ? getOfferKey(row.offer) : `folder:${row.name}`
}

export interface DownloadRowProps {
  row: ReceiveRow
  states: Record<string, DownloadItemState>
  labelsFor: (display: DownloadRowDisplay) => DownloadRowLabels
  transferActive: boolean
  isFirst?: boolean
  compact?: boolean
  onResume: (offer: FileOffer, targetPath: string) => void
  onPause: (offer: FileOffer) => void
  onOpen: (offer: FileOffer, savedTo: string) => void
  onPauseFolder: (offers: FileOffer[]) => void
  onResumeFolder: (offers: FileOffer[]) => void
}

type RowHandlers = Pick<DownloadRowProps, 'onResume' | 'onPause' | 'onOpen'>

interface FileRowProps extends RowHandlers {
  offer: FileOffer
  states: Record<string, DownloadItemState>
  labelsFor: (display: DownloadRowDisplay) => DownloadRowLabels
  transferActive: boolean
  isFirst?: boolean
  compact?: boolean
}

function runRowAction(
  action: NonNullable<DownloadRowAction>,
  offer: FileOffer,
  handlers: RowHandlers
): void {
  switch (action.kind) {
    case 'resume':
      return handlers.onResume(offer, action.targetPath)
    case 'pause':
      return handlers.onPause(offer)
    case 'open':
      return handlers.onOpen(offer, action.savedTo)
  }
}

export function DownloadRow(props: DownloadRowProps) {
  return props.row.kind === 'file' ? (
    <FileRow {...props} offer={props.row.offer} />
  ) : (
    <FolderRow {...props} folder={props.row} />
  )
}

function FileRow({
  offer,
  states,
  labelsFor,
  transferActive,
  isFirst = false,
  compact = false,
  onResume,
  onPause,
  onOpen
}: FileRowProps) {
  const state = states[getOfferKey(offer)]
  const display = getDownloadRowDisplay(offer, state, transferActive)
  const labels = labelsFor(display)
  const action = getDownloadRowAction(display, state)

  return (
    <LinkRow
      file
      bare
      compact={compact}
      isFirst={isFirst}
      label={offer.name}
      size={offer.size}
      description={display.description}
      status={labels.status ? { label: labels.status, tone: display.status.tone } : undefined}
      progressPercent={display.progressPercent}
      trailing={
        action ? (
          <RowActionButton
            kind={action.kind}
            label={labels[action.kind]}
            onPress={() => runRowAction(action, offer, { onResume, onPause, onOpen })}
          />
        ) : undefined
      }
    />
  )
}

function FolderRow({
  folder,
  states,
  labelsFor,
  transferActive,
  isFirst = false,
  onResume,
  onPause,
  onOpen,
  onPauseFolder,
  onResumeFolder
}: DownloadRowProps & { folder: Extract<ReceiveRow, { kind: 'folder' }> }) {
  const { theme } = useTheme()
  const [expanded, setExpanded] = useState(false)
  const display = getFolderRowDisplay(folder.offers, states)
  const labels = labelsFor(display)
  const action = getFolderRowAction(folder.offers, states)

  return (
    <>
      <LinkRow
        icon={<FolderIcon size={16} />}
        bare
        compact
        isFirst={isFirst}
        label={folder.name}
        size={folder.totalSize}
        description={display.description}
        status={labels.status ? { label: labels.status, tone: display.status.tone } : undefined}
        progressPercent={display.progressPercent}
        onPress={() => setExpanded((open) => !open)}
        trailing={
          <html.div style={styles.trailing}>
            {action ? (
              <RowActionButton
                kind={action}
                label={labels[action]}
                onPress={() =>
                  action === 'pause' ? onPauseFolder(folder.offers) : onResumeFolder(folder.offers)
                }
              />
            ) : null}
            <html.div style={[styles.chevron, expanded && styles.chevronOpen]}>
              <ChevronRightIcon size={14} color={theme.colors.colorTextMuted} />
            </html.div>
          </html.div>
        }
      />
      {expanded ? (
        <html.div style={styles.children}>
          {folder.offers.map((offer) => (
            <FileRow
              key={getOfferKey(offer)}
              offer={offer}
              states={states}
              labelsFor={labelsFor}
              transferActive={transferActive}
              onResume={onResume}
              onPause={onPause}
              onOpen={onOpen}
            />
          ))}
        </html.div>
      ) : null}
    </>
  )
}
