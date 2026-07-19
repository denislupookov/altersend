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
  onPauseFolder: (offers: FileOffer[]) => void
  onResumeFolder: (offers: FileOffer[]) => void
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
  onPause
}: DownloadRowProps & { offer: FileOffer }) {
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
        action?.kind === 'resume' ? (
          <RowActionButton
            kind='resume'
            label={labels.resume}
            onPress={() => onResume(offer, action.targetPath)}
          />
        ) : action?.kind === 'pause' ? (
          <RowActionButton kind='pause' label={labels.pause} onPress={() => onPause(offer)} />
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
            {action === 'pause' ? (
              <RowActionButton
                kind='pause'
                label={labels.pause}
                onPress={() => onPauseFolder(folder.offers)}
              />
            ) : action === 'resume' ? (
              <RowActionButton
                kind='resume'
                label={labels.resume}
                onPress={() => onResumeFolder(folder.offers)}
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
              row={{ kind: 'file', offer }}
              offer={offer}
              states={states}
              labelsFor={labelsFor}
              transferActive={transferActive}
              onResume={onResume}
              onPause={onPause}
              onPauseFolder={onPauseFolder}
              onResumeFolder={onResumeFolder}
            />
          ))}
        </html.div>
      ) : null}
    </>
  )
}
