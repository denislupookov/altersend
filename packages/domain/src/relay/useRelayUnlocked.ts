import { useEffect, useRef } from 'react'
import { useSubscriptionStore } from '../account/runtime/store'
import { useTransferStore } from '../transfer/store'

export function useRelayUnlocked(limited: boolean, onUnlocked: () => void): void {
  const selfPro = useSubscriptionStore((s) => s.active)
  const peerPro = useTransferStore((s) =>
    s.transferPeerKey ? Boolean(s.proPeers[s.transferPeerKey]) : false
  )
  const wasLimited = useRef(limited)
  const notify = useRef(onUnlocked)
  notify.current = onUnlocked

  useEffect(() => {
    if (wasLimited.current && !limited && (selfPro || peerPro)) notify.current()
    wasLimited.current = limited
  }, [limited, selfPro, peerPro])
}
