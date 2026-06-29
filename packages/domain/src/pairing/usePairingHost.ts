import { useEffect, useState } from 'react'
import { hostPairingSession } from '../transfer/commands'
import { usePairingVotes } from './usePairingVotes'

interface UsePairingHostResult {
  topic: string
  isPaired: boolean
  isWaiting: boolean
}

export function usePairingHost(isOpen: boolean): UsePairingHostResult {
  const [topic, setTopic] = useState('')
  const [isPaired, setIsPaired] = useState(false)
  const [isWaiting, setIsWaiting] = useState(false)

  useEffect(() => {
    if (isOpen) setIsPaired(false)
  }, [isOpen])

  useEffect(() => {
    if (!isOpen || topic) return
    hostPairingSession()
      .then(setTopic)
      .catch(() => {})
  }, [isOpen, topic])

  usePairingVotes({
    topic,
    engaged: isWaiting,
    onPeerConnected: () => setIsWaiting(true),
    onStalled: () => setIsWaiting(false),
    onPaired: () => {
      setIsPaired(true)
      setIsWaiting(false)
    }
  })

  return { topic, isPaired, isWaiting }
}
