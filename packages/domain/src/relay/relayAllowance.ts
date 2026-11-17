import type { IncomingFileOffer } from '@altersend/core'
import {
  getOfferKey,
  groupReceiveRows,
  type DownloadItemState,
  type ReceiveFileRow,
  type ReceiveRow
} from '../receive/downloadModel'

export interface RelayAllowance {
  freeRows: ReceiveRow[]
  lockedRows: ReceiveRow[]
}

export function receiveRowOffers(row: ReceiveRow): ReceiveFileRow['offer'][] {
  return row.kind === 'file' ? [row.offer] : row.offers
}

function rowSize(row: ReceiveRow): number {
  return row.kind === 'file' ? row.offer.size : row.totalSize
}

function isStarted(row: ReceiveRow, states: Record<string, DownloadItemState>): boolean {
  return receiveRowOffers(row).some(
    (offer) => (states[getOfferKey(offer)]?.status ?? 'idle') !== 'idle'
  )
}

export function splitRelayAllowance(
  rows: ReceiveRow[],
  states: Record<string, DownloadItemState>,
  limitBytes: number
): RelayAllowance {
  let used = rows
    .filter((row) => isStarted(row, states))
    .reduce((sum, row) => sum + rowSize(row), 0)

  const freeRows: ReceiveRow[] = []
  const lockedRows: ReceiveRow[] = []

  for (const row of rows) {
    if (isStarted(row, states)) {
      freeRows.push(row)
      continue
    }
    const size = rowSize(row)
    if (used + size <= limitBytes) {
      freeRows.push(row)
      used += size
    } else {
      lockedRows.push(row)
    }
  }

  return { freeRows, lockedRows }
}

export function lockedOfferKeys(lockedRows: ReceiveRow[]): Set<string> {
  return new Set(lockedRows.flatMap(receiveRowOffers).map(getOfferKey))
}

export function isReceiveRowLocked(row: ReceiveRow, lockedKeys: ReadonlySet<string>): boolean {
  const [offer] = receiveRowOffers(row)
  return offer !== undefined && lockedKeys.has(getOfferKey(offer))
}

export function includesLockedOffer(
  fileIds: string[],
  offers: IncomingFileOffer[],
  states: Record<string, DownloadItemState>,
  limitBytes: number
): boolean {
  const { lockedRows } = splitRelayAllowance(groupReceiveRows(offers), states, limitBytes)
  const locked = lockedOfferKeys(lockedRows)
  return fileIds.some((fileId) => locked.has(fileId))
}
