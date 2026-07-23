import { useMemo } from 'react'
import {
  getDownloadTotals,
  getOfferKey,
  getPendingDownloadOffers,
  getPrimaryDownloadAction,
  groupReceiveRows,
  isResumable,
  type DownloadItemState,
  type DownloadTotals,
  type PrimaryDownloadAction,
  type ReceiveRow
} from '@altersend/domain'
import type { TextOffer } from '../../transfer/peerProtocol'
import type { TransferFile } from '../../types'
import { toDownloadStates } from './downloadView'

export interface DownloadSummary {
  rows: ReceiveRow[]
  states: Record<string, DownloadItemState>
  totals: DownloadTotals
  count: number
  textCount: number
  isDownloading: boolean
  allDownloaded: boolean
  canResumeAll: boolean
  primaryAction: PrimaryDownloadAction
}

export function useDownloadSummary(files: TransferFile[], texts: TextOffer[]): DownloadSummary {
  return useMemo(() => {
    const offers = files.map((file) => file.offer)
    const states = toDownloadStates(files)
    const totals = getDownloadTotals(offers, states)
    const paused = offers.filter((offer) => isResumable(states[getOfferKey(offer)]))
    const pending = getPendingDownloadOffers(offers, states)

    const hasFiles = offers.length > 0
    const isDownloading = totals.activeCount > 0
    const allDownloaded = hasFiles && totals.completedCount === offers.length
    const canResumeAll = !isDownloading && paused.length > 0 && paused.length === pending.length

    return {
      rows: groupReceiveRows(offers),
      states,
      totals,
      count: offers.length,
      textCount: texts.length,
      isDownloading,
      allDownloaded,
      canResumeAll,
      primaryAction: getPrimaryDownloadAction({
        hasFiles,
        allDownloaded,
        peerCount: 1,
        isDownloading,
        canResumeAll
      })
    }
  }, [files, texts])
}
