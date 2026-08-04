import { dispatchToTransferStore, transferStore } from '../store'
import { subscribeAppActive } from './appActive'
import { isBackgroundTransferActive } from './backgroundTransfer'

let started = false
let unsubscribe: (() => void) | null = null

export function startBackgroundReconnectEffect(): () => void {
  if (started) return unsubscribe ?? (() => {})
  started = true

  unsubscribe = subscribeAppActive((active) => {
    if (active || isBackgroundTransferActive()) return
    const state = transferStore.getState()
    if (state.role === 'receiver' && state.incomingFileOffers.length > 0) {
      dispatchToTransferStore({ type: 'reconnecting' })
    }
  })

  return () => {
    started = false
    unsubscribe?.()
    unsubscribe = null
  }
}
