import { useEffect, useRef, useState } from 'react'
import { clearPairingSession, hostPairingSession } from '../transfer/commands'
import { usePairingSessionStore } from './pairingStore'
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

  const sessionActiveRef = useRef(false)
  const { startPairing, endPairing } = usePairingSessionStore()

  useEffect(() => {
    if (!isOpen) return

    startPairing()
    return () => endPairing()
  }, [isOpen, startPairing, endPairing])

  useEffect(() => {
    if (!isOpen) {
      if (sessionActiveRef.current) {
        sessionActiveRef.current = false
        clearPairingSession().catch(() => {})
      }

      setTopic('')
      setIsPaired(false)
      setIsWaiting(false)
      return
    }

    hostPairingSession()
      .then((hostedTopic) => {
        sessionActiveRef.current = true
        setTopic(hostedTopic)
      })
      .catch(() => {})
  }, [isOpen])

  usePairingVotes({
    topic,
    isMine: true,
    engaged: isWaiting,
    onPeerConnected: () => setIsWaiting(true),
    onStalled: () => setIsWaiting(false),
    onPaired: () => {
      setIsPaired(true)
      setIsWaiting(false)
      setTopic('')
    }
  })

  return { topic, isPaired, isWaiting }
}
