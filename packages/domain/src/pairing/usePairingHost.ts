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

  // The worklet owns the host swarm and keeps it alive for the whole app
  // session, so we just (idempotently) start it when the QR is shown and read
  // the stable topic. No teardown — closing the modal or leaving the screen
  // leaves the host announcing, and reopening shows the same code.
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
