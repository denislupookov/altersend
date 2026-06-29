import { useEffect, useRef } from 'react'
import { loadPeers } from '../transfer/commands'
import { useTransferStore } from '../transfer/store'
import { usePairingHost } from './usePairingHost'
import { usePairingJoin } from './usePairingJoin'

interface UsePairingSessionArgs {
  hostOpen: boolean
  joinOpen: boolean
  onPaired: () => void
  onFailed?: () => void
}

export function usePairingSession({
  hostOpen,
  joinOpen,
  onPaired,
  onFailed
}: UsePairingSessionArgs) {
  const peers = useTransferStore((s) => s.peers)
  const {
    topic: pairingTopic,
    isPaired: isHostPaired,
    isWaiting: isHostWaiting
  } = usePairingHost(hostOpen)
  const {
    join,
    setJoinedTopic,
    isJoining,
    isWaitingForPair,
    isPaired: isJoinPaired,
    isFailed: isJoinFailed
  } = usePairingJoin(joinOpen)

  const onPairedRef = useRef(onPaired)
  onPairedRef.current = onPaired
  const onFailedRef = useRef(onFailed)
  onFailedRef.current = onFailed

  useEffect(() => {
    loadPeers().catch(() => {})
  }, [])

  useEffect(() => {
    if (!isHostPaired && !isJoinPaired) return
    onPairedRef.current()
    loadPeers().catch(() => {})
  }, [isHostPaired, isJoinPaired])

  useEffect(() => {
    if (isJoinFailed) onFailedRef.current?.()
  }, [isJoinFailed])

  return {
    peers,
    pairingTopic,
    isHostWaiting,
    isJoinWaiting: isWaitingForPair,
    isJoining,
    join,
    setJoinedTopic
  }
}
