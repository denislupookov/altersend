import {
  getTransferActivity,
  pushRateSample,
  setBackgroundTransferActive,
  transferStore,
  type RateSample,
  type TransferActivity,
  type TransferSessionState
} from '@altersend/domain'
import { AppState } from 'react-native'
import {
  isTransferServiceAvailable,
  notifyTransferCompleted,
  onTransferServiceStopped,
  setTransferServiceTransferring,
  startTransferService,
  stopTransferService,
  updateTransferService
} from '@/modules/transfer-service'
import { mobileApi } from '../api/mobileApi'
import { captureIn } from '../sentry'
import { requestNotificationPermission } from './notificationPermission'
import {
  buildReceivedNotification,
  buildSentNotification,
  buildTransferNotification,
  getChannelName,
  type CompletionNotification
} from './backgroundTransferNotification'

const MIN_UPDATE_INTERVAL_MS = 200
const RATE_REFRESH_INTERVAL_MS = 1000

interface TransferSession {
  lastUpdatedAt: number
  lastStatus: string
  lastPercent: number
  lastPhase: TransferActivity['phase']
  announced: Set<string>
  samples: RateSample[]
}

function statusOf(activity: TransferActivity): string {
  return [activity.phase, activity.role, activity.deviceCount, activity.receivedPeers.length].join(
    ':'
  )
}

let started = false
let session: TransferSession | null = null

const report = (context: string) => captureIn(`backgroundTransferService.${context}`)

function begin(activity: TransferActivity, now: number): void {
  const current: TransferSession = {
    lastUpdatedAt: now,
    lastStatus: statusOf(activity),
    lastPercent: activity.percent,
    lastPhase: activity.phase,
    announced: new Set(activity.receivedPeers),
    samples: pushRateSample([], activity.bytesTransferred, now)
  }
  session = current
  setBackgroundTransferActive(true)
  mobileApi.resumeWorklet()

  setTransferServiceTransferring(activity.phase === 'transferring').catch(report('setTransferring'))
  requestNotificationPermission().catch(report('permission'))

  startTransferService(
    buildTransferNotification(activity, current.samples),
    getChannelName()
  ).catch((error: unknown) => {
    report('start')(error)
    if (session === current) end()
  })
}

function shouldRepaint(current: TransferSession, activity: TransferActivity, now: number): boolean {
  if (statusOf(activity) !== current.lastStatus) return true
  if (activity.phase !== 'transferring') return false

  const elapsed = now - current.lastUpdatedAt
  if (elapsed < MIN_UPDATE_INTERVAL_MS) return false
  return activity.percent !== current.lastPercent || elapsed >= RATE_REFRESH_INTERVAL_MS
}

function syncWakeLock(current: TransferSession, activity: TransferActivity): void {
  if (activity.phase === current.lastPhase) return

  current.lastPhase = activity.phase
  setTransferServiceTransferring(activity.phase === 'transferring').catch(report('setTransferring'))
}

function update(current: TransferSession, activity: TransferActivity, now: number): void {
  syncWakeLock(current, activity)

  current.lastUpdatedAt = now
  current.lastStatus = statusOf(activity)
  current.lastPercent = activity.percent
  current.samples = pushRateSample(current.samples, activity.bytesTransferred, now)

  updateTransferService(buildTransferNotification(activity, current.samples)).catch(
    report('update')
  )
}

function postCompletion({ title, text }: CompletionNotification): void {
  notifyTransferCompleted(title, text, getChannelName()).catch(report('notifyCompleted'))
}

function announceSent(
  current: TransferSession,
  activity: TransferActivity,
  state: TransferSessionState
): void {
  for (const peerKey of activity.receivedPeers) {
    if (current.announced.has(peerKey)) continue
    current.announced.add(peerKey)

    postCompletion(
      buildSentNotification(state.remember.peerDisplayNames[peerKey], state.uploadItems)
    )
  }
}

function announceReceived(activity: TransferActivity, state: TransferSessionState): void {
  if (activity.role !== 'receiver' || activity.active || !activity.settled) return
  if (activity.bytesTransferred <= 0) return

  postCompletion(buildReceivedNotification(state.receiveDownloadStates, activity.bytesTransferred))
}

function end(): void {
  session = null
  setBackgroundTransferActive(false)
  stopTransferService().catch(report('stop'))
  mobileApi.syncWorkletLifecycle()
}

function evaluate(now: number): void {
  const state = transferStore.getState()
  const activity = getTransferActivity(state)
  const current = session

  if (!current) {
    if (activity.active) begin(activity, now)
    return
  }

  announceSent(current, activity, state)

  if (!activity.active) {
    announceReceived(activity, state)
    end()
    return
  }

  if (shouldRepaint(current, activity, now)) update(current, activity, now)
}

export function startBackgroundTransferService(): () => void {
  if (started || !isTransferServiceAvailable()) return () => {}
  started = true

  const unsubscribeStore = transferStore.subscribe(() => evaluate(Date.now()))
  const appStateSubscription = AppState.addEventListener('change', () => evaluate(Date.now()))
  const unsubscribeService = onTransferServiceStopped(() => {
    if (session) end()
  })

  return () => {
    started = false
    unsubscribeStore()
    appStateSubscription.remove()
    unsubscribeService()
    if (session) end()
  }
}
