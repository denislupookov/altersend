import { useCallback, useMemo } from 'react'
import type { IncomingFileOffer } from '@altersend/core'
import { useTransferStore } from '../transfer/store'
import { downloadFiles, pauseDownload } from '../transfer/commands'
import { useTransferRates } from '../transfer/useTransferRates'
import type { TransferRate } from '../transfer/rate'
import {
  createDirectoryDownloadRequests,
  createSingleDownloadRequest,
  getActiveDownloadProgress,
  getDownloadTotals,
  getOfferKey,
  canStopDownload,
  getPendingDownloadOffers,
  getPrimaryDownloadAction,
  groupReceiveRows,
  isResumable,
  type DownloadItemState,
  type DownloadTotals,
  type PrimaryDownloadAction,
  type ReceiveRow
} from './downloadModel'

export type ReceiveFileOffer = Extract<IncomingFileOffer, { kind: 'file' }>
export type ReceiveTextOffer = Extract<IncomingFileOffer, { kind: 'text' }>

export function useDownloadRates(
  states: Record<string, DownloadItemState>,
  enabled: boolean
): Record<string, TransferRate> {
  const progress = useMemo(() => getActiveDownloadProgress(states), [states])
  return useTransferRates(progress, enabled)
}

export interface ReceiveDownloads {
  rows: ReceiveRow[]
  fileOffers: ReceiveFileOffer[]
  textOffers: ReceiveTextOffer[]
  pendingOffers: ReceiveFileOffer[]
  pausedOffers: ReceiveFileOffer[]
  states: Record<string, DownloadItemState>
  totals: DownloadTotals
  rates: Record<string, TransferRate>
  hasFiles: boolean
  isDownloading: boolean
  allDownloaded: boolean
  canResumeAll: boolean
  primaryAction: PrimaryDownloadAction
}

export function useReceiveDownloads(): ReceiveDownloads {
  const incomingFileOffers = useTransferStore((s) => s.incomingFileOffers)
  const states = useTransferStore((s) => s.receiveDownloadStates)
  const peerCount = useTransferStore((s) => s.peerCount)

  const rows = useMemo(() => groupReceiveRows(incomingFileOffers), [incomingFileOffers])
  const totals = useMemo(
    () => getDownloadTotals(incomingFileOffers, states),
    [incomingFileOffers, states]
  )
  const fileOffers = useMemo(
    () => incomingFileOffers.filter((o): o is ReceiveFileOffer => o.kind === 'file'),
    [incomingFileOffers]
  )
  const textOffers = useMemo(
    () => incomingFileOffers.filter((o): o is ReceiveTextOffer => o.kind === 'text'),
    [incomingFileOffers]
  )
  const pendingOffers = useMemo(
    () => getPendingDownloadOffers(fileOffers, states) as ReceiveFileOffer[],
    [fileOffers, states]
  )
  const pausedOffers = useMemo(
    () => fileOffers.filter((offer) => isResumable(states[getOfferKey(offer)])),
    [fileOffers, states]
  )

  const isDownloading = totals.activeCount > 0
  const rates = useDownloadRates(states, isDownloading)
  const hasFiles = fileOffers.length > 0
  const allDownloaded = hasFiles && totals.completedCount === fileOffers.length
  const canResumeAll =
    !isDownloading && pausedOffers.length > 0 && pausedOffers.length === pendingOffers.length

  const primaryAction = getPrimaryDownloadAction({
    hasFiles,
    allDownloaded,
    peerCount,
    isDownloading,
    canResumeAll
  })

  return {
    rows,
    fileOffers,
    textOffers,
    pendingOffers,
    pausedOffers,
    states,
    totals,
    rates,
    hasFiles,
    isDownloading,
    allDownloaded,
    canResumeAll,
    primaryAction
  }
}

export interface ReceiveActions {
  resumeFile: (offer: ReceiveFileOffer, targetPath: string) => void
  pauseFile: (offer: ReceiveFileOffer) => void
  pauseFolder: (offers: ReceiveFileOffer[]) => void
  resumeFolder: (offers: ReceiveFileOffer[]) => void
  resumeAll: () => Promise<void>
  downloadInto: (targetDir: string) => Promise<void>
  replaceWith: (offer: ReceiveFileOffer, targetPath: string) => Promise<void>
}

const report = (label: string) => (err: unknown) => console.warn(`Receive: ${label} failed`, err)

export function useReceiveActions(downloads: ReceiveDownloads): ReceiveActions {
  const { states, pausedOffers, pendingOffers } = downloads

  const resumeFile = useCallback((offer: ReceiveFileOffer, targetPath: string) => {
    downloadFiles([createSingleDownloadRequest(offer, targetPath)]).catch(report('resume'))
  }, [])

  const pauseFile = useCallback((offer: ReceiveFileOffer) => {
    pauseDownload(getOfferKey(offer)).catch(report('pause'))
  }, [])

  const pauseFolder = useCallback(
    (offers: ReceiveFileOffer[]) => {
      const stoppable = offers.filter((offer) => canStopDownload(states[getOfferKey(offer)]))
      Promise.all(stoppable.map((offer) => pauseDownload(getOfferKey(offer)))).catch(
        report('pause folder')
      )
    },
    [states]
  )

  const resumeFolder = useCallback(
    (offers: ReceiveFileOffer[]) => {
      const requests = offers
        .map((offer) => {
          const state = states[getOfferKey(offer)]
          return isResumable(state) && state?.savedTo
            ? createSingleDownloadRequest(offer, state.savedTo)
            : null
        })
        .filter((request) => request !== null)
      if (requests.length > 0) downloadFiles(requests).catch(report('resume folder'))
    },
    [states]
  )

  const resumeAll = useCallback(async () => {
    const requests = pausedOffers
      .map((offer) => {
        const savedTo = states[getOfferKey(offer)]?.savedTo
        return savedTo ? createSingleDownloadRequest(offer, savedTo) : null
      })
      .filter((request) => request !== null)
    if (requests.length > 0) await downloadFiles(requests)
  }, [pausedOffers, states])

  const downloadInto = useCallback(
    async (targetDir: string) => {
      if (pendingOffers.length === 0) return
      await downloadFiles(createDirectoryDownloadRequests(pendingOffers, targetDir))
    },
    [pendingOffers]
  )

  const replaceWith = useCallback(async (offer: ReceiveFileOffer, targetPath: string) => {
    await downloadFiles([createSingleDownloadRequest(offer, targetPath, true)])
  }, [])

  return {
    resumeFile,
    pauseFile,
    pauseFolder,
    resumeFolder,
    resumeAll,
    downloadInto,
    replaceWith
  }
}
