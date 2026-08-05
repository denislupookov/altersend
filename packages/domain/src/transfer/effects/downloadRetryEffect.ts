import {
  createSingleDownloadRequest,
  getOfferKey,
  isAutoResumable
} from '../../receive/downloadModel'
import { downloadFiles } from '../commands'
import { reportError } from '../binding'
import { dispatchToTransferStore, transferStore } from '../store'
import type { TransferSessionState } from '../types'

const MAX_ATTEMPTS = 3

let started = false
let unsubscribe: (() => void) | null = null
let inFlight = false
const attempts = new Map<string, number>()
const seenBytes = new Map<string, number>()

function collectRetryable(state: TransferSessionState): string[] {
  const retryable: string[] = []

  for (const [key, item] of Object.entries(state.receiveDownloadStates)) {
    if (item.bytesTransferred > (seenBytes.get(key) ?? 0)) {
      seenBytes.set(key, item.bytesTransferred)
      attempts.delete(key)
    }

    if (item.status === 'downloading') continue
    if (item.status === 'completed') {
      attempts.delete(key)
      continue
    }
    if (isAutoResumable(item)) retryable.push(key)
  }

  return retryable
}

function retry(state: TransferSessionState, keys: string[]): void {
  const exhausted = keys.filter((key) => (attempts.get(key) ?? 0) >= MAX_ATTEMPTS)
  if (exhausted.length > 0) {
    dispatchToTransferStore({ type: 'downloads_retries_exhausted', offerKeys: exhausted })
  }

  const retryable = keys.filter((key) => (attempts.get(key) ?? 0) < MAX_ATTEMPTS)
  if (retryable.length === 0) return

  const requests = retryable
    .map((key) => {
      const offer = state.incomingFileOffers.find((item) => getOfferKey(item) === key)
      const savedTo = state.receiveDownloadStates[key]?.savedTo
      if (offer?.kind !== 'file' || !savedTo) return null
      return createSingleDownloadRequest(offer, savedTo)
    })
    .filter((request) => request !== null)

  if (requests.length === 0) return

  for (const key of retryable) attempts.set(key, (attempts.get(key) ?? 0) + 1)

  inFlight = true
  downloadFiles(requests)
    .catch((error: unknown) => reportError('downloadRetryEffect', error))
    .finally(() => {
      inFlight = false
      evaluate(transferStore.getState())
    })
}

function evaluate(state: TransferSessionState): void {
  if (state.role !== 'receiver') {
    attempts.clear()
    seenBytes.clear()
    return
  }
  if (inFlight || state.peerCount === 0) return

  const keys = collectRetryable(state)
  if (keys.length > 0) retry(state, keys)
}

export function startDownloadRetryEffect(): () => void {
  if (started) return teardown
  started = true

  unsubscribe = transferStore.subscribe(evaluate)

  return teardown
}

function teardown(): void {
  started = false
  inFlight = false
  attempts.clear()
  seenBytes.clear()
  unsubscribe?.()
  unsubscribe = null
}
