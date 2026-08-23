import { useState } from 'react'
import type { IncomingInvite, TransferSessionState } from '../transfer/types'

export interface AutoAcceptStoragePort {
  read(): boolean
  write(enabled: boolean): void
}

export function useAutoAcceptSetting(storage: AutoAcceptStoragePort) {
  const [enabled, setEnabledState] = useState(() => storage.read())

  const setEnabled = (next: boolean) => {
    if (next === enabled) return
    setEnabledState(next)
    storage.write(next)
  }

  return { enabled, setEnabled }
}

export function canAutoAcceptInvite(
  state: TransferSessionState,
  invite: IncomingInvite,
  enabled: boolean
): boolean {
  if (!enabled) return false
  if (state.role === 'sender') return false
  if (state.selectedFiles.length > 0) return false
  if (state.connectionState === 'peer-connected') return false

  const key = invite.remoteDevicePubkey.toLowerCase()
  return state.peers.some((peer) => peer.remoteDevicePubkey.toLowerCase() === key)
}
