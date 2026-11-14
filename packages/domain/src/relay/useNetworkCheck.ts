import { useCallback, useEffect, useState } from 'react'
import type { NetworkCheckReply, NetworkStatus } from '@altersend/core'

export type NetworkCheckState = 'checking' | NetworkStatus

export interface NetworkCheck {
  state: NetworkCheckState
  retry: () => void
}

export function useNetworkCheck(
  check: () => Promise<NetworkCheckReply>,
  active: boolean
): NetworkCheck {
  const [state, setState] = useState<NetworkCheckState>('checking')
  const [attempt, setAttempt] = useState(0)
  const [started, setStarted] = useState(false)

  useEffect(() => {
    if (active) setStarted(true)
  }, [active])

  useEffect(() => {
    if (!started) return
    let cancelled = false
    setState('checking')
    check()
      .then((reply) => {
        if (!cancelled) setState(reply.status)
      })
      .catch((err: unknown) => {
        console.warn('network check failed', err)
        if (!cancelled) setState('offline')
      })
    return () => {
      cancelled = true
    }
  }, [check, started, attempt])

  const retry = useCallback(() => setAttempt((n) => n + 1), [])

  return { state, retry }
}
