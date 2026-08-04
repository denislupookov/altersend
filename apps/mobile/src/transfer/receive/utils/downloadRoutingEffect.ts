import {
  dispatchToTransferStore,
  transferStore,
  type DownloadItemState,
  type SaveDestination,
  type TransferAction
} from '@altersend/domain'
import type { IncomingFileOffer } from '@altersend/core'
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
}

let started = false
let unsubscribe: (() => void) | null = null
let lastStates: Record<string, DownloadItemState> | null = null
let lastOffers: IncomingFileOffer[] | null = null
let offersById = new Map<string, IncomingFileOffer>()

function indexOffers(offers: IncomingFileOffer[]): void {
  if (offers === lastOffers) return
  lastOffers = offers
  offersById = new Map(offers.map((offer) => [offer.id, offer]))
}

function reset(): void {
  lastStates = null
  lastOffers = null
  offersById = new Map()
  processed = new Set()
}

function evaluate(state: ReturnType<typeof transferStore.getState>): void {
  const { receiveDownloadStates, incomingFileOffers } = state
  if (receiveDownloadStates === lastStates) return
  lastStates = receiveDownloadStates

  const entries = Object.entries(receiveDownloadStates)
  if (entries.length === 0) {
    if (processed.size > 0) flushNow()
    reset()
    return
  }

  indexOffers(incomingFileOffers)

  for (const [offerKey, item] of entries) {
    if (processed.has(offerKey)) continue
    if (item.status !== 'completed') continue
    if (item.destination !== undefined || !item.savedTo) continue

    const offer = offersById.get(offerKey)
    if (offer?.kind !== 'file') continue

    processed.add(offerKey)
    routeOne(offerKey, item.savedTo, offer.name).catch((err: unknown) => {
      console.error('downloadRoutingEffect: routing failed for', offerKey, err)
    })
  }
}

function teardown(): void {
  started = false
  if (flushTimer) {
    clearTimeout(flushTimer)
    flushTimer = null
  }
  pendingDestinations = []
  reset()
  unsubscribe?.()
  unsubscribe = null
}

export function startDownloadRoutingEffect(): () => void {
  if (started) return teardown
  started = true

  evaluate(transferStore.getState())
  unsubscribe = transferStore.subscribe(evaluate)

  return teardown
}
