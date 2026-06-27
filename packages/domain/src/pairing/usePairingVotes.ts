import { useEffect, useRef } from 'react'
import { rememberVote, subscribeToPeerConnected } from '../transfer/commands'
import { useTransferStore } from '../transfer/store'

const PAIRING_STALL_MS = 20_000

interface UsePairingVotesArgs {
  topic: string
  isMine: boolean
  engaged?: boolean
  onPeerConnected?: () => void
  onPaired: () => void
  onStalled?: () => void
}

export function usePairingVotes({ topic, isMine, engaged = true, onPeerConnected, onPaired, onStalled }: UsePairingVotesArgs) {
  const votedPeersRef = useRef(new Set<string>())
  const prevPairStatusRef = useRef<Record<string, string>>({})

  const pairStatus = useTransferStore((s) => s.remember.pairStatus)
  const incomingRequest = useTransferStore((s) => s.remember.incomingRequest)

  const onPeerConnectedRef = useRef(onPeerConnected)
  onPeerConnectedRef.current = onPeerConnected
  
  const onPairedRef = useRef(onPaired)
  onPairedRef.current = onPaired

  const onStalledRef = useRef(onStalled)
  onStalledRef.current = onStalled

  useEffect(() => {
    if (!topic) votedPeersRef.current.clear()
  }, [topic])

  useEffect(() => {
    if (!topic || !incomingRequest) return

    const { peerKey, transferId } = incomingRequest
    if (votedPeersRef.current.has(peerKey)) return

    votedPeersRef.current.add(peerKey)
    rememberVote({ transferId, peerKey, vote: 'remember', isMine }).catch(() => {})
  }, [incomingRequest, topic, isMine])

  useEffect(() => {
    if (!topic) return

    return subscribeToPeerConnected((peerKey) => {
      onPeerConnectedRef.current?.()
      if (votedPeersRef.current.has(peerKey)) return

      votedPeersRef.current.add(peerKey)
      rememberVote({ transferId: topic, peerKey, vote: 'remember', isMine }).catch(() => {})
    })
  }, [topic, isMine])

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
