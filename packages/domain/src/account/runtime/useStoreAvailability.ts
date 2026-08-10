import { useEffect, useState } from 'react'
import type { PurchaseAdapter } from '../ports'

export function useStoreAvailability(purchases?: PurchaseAdapter): boolean {
  const [unavailable, setUnavailable] = useState(false)

  useEffect(() => {
    if (!purchases) return

    let cancelled = false

    purchases
      .available()
      .then((ok) => {
        if (!cancelled) setUnavailable(!ok)
      })
      .catch(() => {
        if (!cancelled) setUnavailable(true)
      })

    return () => {
      cancelled = true
    }
  }, [purchases])

  return unavailable
}
