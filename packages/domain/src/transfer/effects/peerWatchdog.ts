import { getTransferApi, reportError } from '../binding'
import { dispatchToTransferStore, transferStore } from '../store'
import { getAppActive, subscribeAppActive } from './appActive'

const RECONNECT_TIMEOUT_MS = 30_000
const INITIAL_CONNECT_TIMEOUT_MS = 60_000

interface WatchdogKey {
  shouldWatch: boolean
  timeoutMs: number
}

function evaluate(): WatchdogKey {
  const state = transferStore.getState()
  const shouldWatch = getAppActive() && state.role === 'receiver' && state.peerCount === 0
  const timeoutMs =
    state.isReconnecting || state.incomingFileOffers.length > 0
      ? RECONNECT_TIMEOUT_MS
      : INITIAL_CONNECT_TIMEOUT_MS
  return { shouldWatch, timeoutMs }
}

let timer: ReturnType<typeof setTimeout> | null = null
let lastKey: WatchdogKey = {
  shouldWatch: false,
  timeoutMs: INITIAL_CONNECT_TIMEOUT_MS
}

function applyKey(key: WatchdogKey): void {
  if (key.shouldWatch === lastKey.shouldWatch && key.timeoutMs === lastKey.timeoutMs) {
    return
  }
  lastKey = key
  if (timer) {
    clearTimeout(timer)
    timer = null
  }
  if (!key.shouldWatch) return
  timer = setTimeout(() => {
    dispatchToTransferStore({ type: 'peer_unreachable' })

    getTransferApi()
      .worker.disconnect()
      .catch((err: unknown) => {
        reportError('peerWatchdog.disconnect', err)
      })
  }, key.timeoutMs)
}

let started = false
let unsubscribers: Array<() => void> = []

export function startPeerWatchdog(): () => void {
  if (started) return teardown
  started = true
  applyKey(evaluate())

  const reevaluate = () => applyKey(evaluate())
  unsubscribers = [transferStore.subscribe(reevaluate), subscribeAppActive(reevaluate)]

  return teardown
}

function teardown(): void {
  if (!started) return
  started = false
  if (timer) {
    clearTimeout(timer)
    timer = null
  }
  lastKey = { shouldWatch: false, timeoutMs: INITIAL_CONNECT_TIMEOUT_MS }
  unsubscribers.forEach((off) => off())
  unsubscribers = []
}
