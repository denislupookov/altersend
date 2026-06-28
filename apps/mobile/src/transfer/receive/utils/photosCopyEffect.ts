import {
  dispatchToTransferStore,
  transferStore,
  type SaveDestination,
  type TransferAction
} from '@altersend/domain'
import { handleDownloadedFile } from './downloadHandlers'
import { buildCompletionToast } from './completionToast'
import { pushToast } from '@/src/components/Toast'

const TOAST_FLUSH_DELAY_MS = 1500

let processed = new Set<string>()
let pendingDestinations: SaveDestination[] = []
let flushTimer: ReturnType<typeof setTimeout> | null = null

function flushNow(): void {
  if (flushTimer) {
    clearTimeout(flushTimer)
    flushTimer = null
  }
  if (pendingDestinations.length === 0) return
  const destinations = pendingDestinations
  pendingDestinations = []
  const toast = buildCompletionToast({ destinations })
  if (toast) pushToast(toast)
}

function scheduleFlush(): void {
  if (flushTimer) clearTimeout(flushTimer)
  flushTimer = setTimeout(() => {
    flushTimer = null
    flushNow()
  }, TOAST_FLUSH_DELAY_MS)
}

async function routeOne(offerKey: string, savedTo: string, fileName: string): Promise<void> {
  try {
    const routing = await handleDownloadedFile(savedTo, fileName)
    const action: TransferAction = {
      type: 'download_routed',
      offerKey,
      destination: routing.destination,
      intendedDestination: routing.intended,
      savedTo: routing.localPath
    }
    dispatchToTransferStore(action)
    pendingDestinations.push(routing.destination)
    scheduleFlush()
  } catch (err) {
    console.error('photosCopyEffect: routing failed for', offerKey, err)
  }
}

let started = false
let unsubscribe: (() => void) | null = null

export function startPhotosCopyEffect(): () => void {
  if (started) return unsubscribe ?? (() => {})
  started = true

  const evaluate = (state: ReturnType<typeof transferStore.getState>): void => {
    const { receiveDownloadStates, incomingFileOffers } = state

    if (Object.keys(receiveDownloadStates).length === 0) {
      if (processed.size > 0) {
        flushNow()
        processed = new Set()
      }
      return
    }

    for (const [offerKey, item] of Object.entries(receiveDownloadStates)) {
      if (item.status !== 'completed') continue
      if (item.destination !== undefined) continue
      if (processed.has(offerKey)) continue
      if (!item.savedTo) continue

      const offer = incomingFileOffers.find((f) => f.id === offerKey)
      if (offer?.kind !== 'file') continue

      processed.add(offerKey)
      void routeOne(offerKey, item.savedTo, offer.name)
    }
  }

  evaluate(transferStore.getState())
  unsubscribe = transferStore.subscribe(evaluate)

  return () => {
    started = false
    if (flushTimer) {
      clearTimeout(flushTimer)
      flushTimer = null
    }
    pendingDestinations = []
    processed = new Set()
    unsubscribe?.()
    unsubscribe = null
  }
}
