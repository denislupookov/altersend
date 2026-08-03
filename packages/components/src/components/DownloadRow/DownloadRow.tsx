import { useState } from 'react'
import { html } from 'react-strict-dom'
import {
  getDownloadRowAction,
  getDownloadRowDisplay,
  getFolderRowAction,
  getFolderRowDisplay,
  getFolderTransferRate,
  getOfferKey,
  type DownloadItemState,
  type DownloadRowDisplay,
  type DownloadRowAction,
  type DownloadRowLabels,
  type ReceiveRow,
  type TransferRate
} from '@altersend/domain'
import type { IncomingFileOffer } from '@altersend/core'
import { LinkRow, type LinkRowStatus } from '../LinkRow'
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
  rates: Record<string, TransferRate>
  rateLabelFor: (rate: TransferRate | undefined) => string | undefined
  labelsFor: (display: DownloadRowDisplay) => DownloadRowLabels
  transferActive: boolean
  isFirst?: boolean
  compact?: boolean
  standalone?: boolean
  onResume: (offer: FileOffer, targetPath: string) => void
  onPause?: (offer: FileOffer) => void
  onOpen: (offer: FileOffer, savedTo: string) => void
  onPauseFolder?: (offers: FileOffer[]) => void
  onResumeFolder: (offers: FileOffer[]) => void
}

type RowHandlers = Pick<DownloadRowProps, 'onResume' | 'onPause' | 'onOpen'>

type RowPresentation = Pick<
  DownloadRowProps,
  | 'states'
  | 'rates'
  | 'rateLabelFor'
  | 'labelsFor'
  | 'transferActive'
  | 'isFirst'
  | 'compact'
  | 'standalone'
>

interface FileRowProps extends RowHandlers, RowPresentation {
  offer: FileOffer
}

function toRowStatus(
  display: DownloadRowDisplay,
  labels: DownloadRowLabels
): LinkRowStatus | undefined {
  if (!labels.status) return undefined
  return { label: labels.status, tone: display.status.tone, detail: display.rateLabel }
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
      return handlers.onPause?.(offer)
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
  rates,
  rateLabelFor,
  labelsFor,
  transferActive,
  isFirst = false,
  compact = false,
  standalone = false,
  onResume,
  onPause,
  onOpen
}: FileRowProps) {
  const key = getOfferKey(offer)
  const state = states[key]
  const display = getDownloadRowDisplay(offer, state, transferActive, rateLabelFor(rates[key]))
  const labels = labelsFor(display)
  const action = getDownloadRowAction(display, state)

  return (
    <LinkRow
      file
      bare={!standalone}
      standalone={standalone}
      compact={compact}
      isFirst={isFirst}
      label={offer.name}
      size={offer.size}
      description={display.description}
      status={toRowStatus(display, labels)}
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
  rates,
  rateLabelFor,
  labelsFor,
  transferActive,
  isFirst = false,
  compact = false,
  standalone = false,
  onResume,
  onPause,
  onOpen,
  onPauseFolder,
  onResumeFolder
}: DownloadRowProps & { folder: Extract<ReceiveRow, { kind: 'folder' }> }) {
  const { theme } = useTheme()
  const [expanded, setExpanded] = useState(false)
  const display = getFolderRowDisplay(
    folder.offers,
    states,
    rateLabelFor(getFolderTransferRate(folder.offers, states, rates))
  )
  const labels = labelsFor(display)
  const action = getFolderRowAction(folder.offers, states)

  return (
    <>
      <LinkRow
        icon={<FolderIcon size={16} />}
        bare={!standalone}
        standalone={standalone}
        compact={compact}
        isFirst={isFirst}
        label={folder.name}
        size={folder.totalSize}
        description={display.description}
        status={toRowStatus(display, labels)}
        progressPercent={display.progressPercent}
        onPress={() => setExpanded((open) => !open)}
        trailing={
          <html.div style={styles.trailing}>
            {action ? (
              <RowActionButton
                kind={action}
                label={labels[action]}
                onPress={() =>
                  action === 'pause'
                    ? onPauseFolder?.(folder.offers)
                    : onResumeFolder(folder.offers)
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
              rates={rates}
              rateLabelFor={rateLabelFor}
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
