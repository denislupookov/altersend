import { useEffect } from 'react'
import { pushToast } from '@/src/components/Toast'

const ERROR_TOAST_DURATION_MS = 5000

let shown: string | null = null

export function useErrorToast(message: string | null, title: string): void {
  useEffect(() => {
    if (!message) {
      shown = null
      return
    }
    if (shown === message) return

    shown = message
    pushToast({ title, hint: message, tone: 'error', durationMs: ERROR_TOAST_DURATION_MS })
  }, [message, title])
}
