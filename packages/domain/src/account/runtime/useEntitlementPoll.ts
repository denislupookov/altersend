import { useCallback, useEffect, useRef } from 'react'
import type { AccountClient, AccountStatus } from '../transport'

const FAST_MS = 3000
const SLOW_MS = 10000
const FAST_WINDOW_MS = 60 * 1000
const TIMEOUT_MS = 15 * 60 * 1000

export interface EntitlementPollOptions {
  client: AccountClient
  onActive(code: string, status: AccountStatus): void | Promise<void>
  onTimeout(): void
}

export interface EntitlementPoll {
  start(code: string): void
  stop(): void
}

const warn = (err: unknown) => console.warn('[account] entitlement poll failed', err)

export function useEntitlementPoll({
  client,
  onActive,
  onTimeout
}: EntitlementPollOptions): EntitlementPoll {
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const attempt = useRef(0)

  const stop = useCallback(() => {
    attempt.current += 1
    if (!timer.current) return
    clearTimeout(timer.current)
    timer.current = null
  }, [])

  useEffect(() => stop, [stop])

  const start = useCallback(
    (code: string) => {
      stop()
      const run = attempt.current
      const startedAt = Date.now()

      const schedule = () => {
        if (run !== attempt.current) return
        const elapsed = Date.now() - startedAt

        if (elapsed > TIMEOUT_MS) {
          onTimeout()
          return
        }

        timer.current = setTimeout(tick, elapsed < FAST_WINDOW_MS ? FAST_MS : SLOW_MS)
      }

      const tick = () => {
        client
          .status(code)
          .then(async (status) => {
            if (run !== attempt.current) return
            if (!status.active) {
              schedule()
              return
            }

            stop()
            await onActive(code, status)
          })
          .catch((err) => {
            warn(err)
            schedule()
          })
      }

      schedule()
    },
    [client, onActive, onTimeout, stop]
  )

  return { start, stop }
}
