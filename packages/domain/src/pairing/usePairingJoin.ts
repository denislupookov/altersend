import { useEffect, useState } from 'react'
import { joinPairingSession } from '../transfer/commands'
import { extractJoinCode } from '../receive/joinCode'
import { usePairingSessionStore } from './pairingStore'
import { usePairingVotes } from './usePairingVotes'

interface UsePairingJoinResult {
  join: (input: string) => Promise<boolean>
  setJoinedTopic: (topic: string) => void
  isJoining: boolean
  isWaitingForPair: boolean
  isPaired: boolean
  isFailed: boolean
}

export function usePairingJoin(isOpen: boolean): UsePairingJoinResult {
  const [joiningTopic, setJoiningTopic] = useState('')
  const [isJoining, setIsJoining] = useState(false)
  const [isPaired, setIsPaired] = useState(false)
  const [isFailed, setIsFailed] = useState(false)

  const { startPairing, endPairing } = usePairingSessionStore()

  useEffect(() => {
    if (!isOpen) return

    startPairing()
    return () => endPairing()
  }, [isOpen, startPairing, endPairing])

  useEffect(() => {
    if (isOpen) return

    setJoiningTopic('')
    setIsJoining(false)
    setIsPaired(false)
    setIsFailed(false)
  }, [isOpen])

  usePairingVotes({
    topic: joiningTopic,
    onPaired: () => {
      setIsPaired(true)
      setJoiningTopic('')
    },
    onStalled: () => {
      setJoiningTopic('')
      setIsFailed(true)
    }
  })

  const join = async (input: string): Promise<boolean> => {
    const code = extractJoinCode(input)
    if (!code) return false

    setIsFailed(false)
    setIsJoining(true)
    try {
      await joinPairingSession(code)
      setJoiningTopic(code)
      return true
    } catch {
      return false
    } finally {
      setIsJoining(false)
    }
  }

  const setJoinedTopic = (topic: string) => {
    setIsFailed(false)
    setJoiningTopic(topic)
  }

  return {
    join,
    setJoinedTopic,
    isJoining,
    isWaitingForPair: joiningTopic !== '',
    isPaired,
    isFailed
  }
}
