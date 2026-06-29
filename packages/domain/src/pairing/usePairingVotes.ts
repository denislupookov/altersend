import { useEffect, useRef } from 'react'
import { subscribeToPairingPeerConnected } from '../transfer/commands'
import { useTransferStore } from '../transfer/store'

const PAIRING_STALL_MS = 20_000

interface UsePairingVotesArgs {
  topic: string
  engaged?: boolean
  onPeerConnected?: () => void
  onPaired: () => void
  onStalled?: () => void
}

export function usePairingVotes({
  topic,
  engaged = true,
  onPeerConnected,
  onPaired,
  onStalled
}: UsePairingVotesArgs) {
  const prevPairStatusRef = useRef<Record<string, string>>({})
  const pairStatus = useTransferStore((s) => s.remember.pairStatus)

  const onPeerConnectedRef = useRef(onPeerConnected)
  onPeerConnectedRef.current = onPeerConnected

  const onPairedRef = useRef(onPaired)
  onPairedRef.current = onPaired

  const onStalledRef = useRef(onStalled)
  onStalledRef.current = onStalled

  useEffect(() => {
    if (!topic) return
    return subscribeToPairingPeerConnected(() => onPeerConnectedRef.current?.())
  }, [topic])

  useEffect(() => {
    const prev = prevPairStatusRef.current
    prevPairStatusRef.current = pairStatus
    if (!topic) return

    const newlyPaired = Object.entries(pairStatus).some(
      ([key, status]) => status === 'paired' && prev[key] !== 'paired'
    )
    if (newlyPaired) onPairedRef.current()
  }, [pairStatus, topic])

  useEffect(() => {
    if (!topic || !engaged) return

    const timer = setTimeout(() => onStalledRef.current?.(), PAIRING_STALL_MS)
    return () => clearTimeout(timer)
  }, [topic, engaged])
}
