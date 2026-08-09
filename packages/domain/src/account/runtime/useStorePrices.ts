import { useEffect, useState } from 'react'
import { pricesFrom, type PlanPrices } from '../core'
import type { PurchaseAdapter } from '../ports'

export function useStorePrices(purchases?: PurchaseAdapter): PlanPrices {
  const [prices, setPrices] = useState<PlanPrices>({})

  useEffect(() => {
    if (!purchases) return
    let cancelled = false

    purchases
      .offers()
      .then((offers) => {
        if (!cancelled) setPrices(pricesFrom(offers))
      })
      .catch((err) => console.warn('[account] loading store prices failed', err))

    return () => {
      cancelled = true
    }
  }, [purchases])

  return prices
}
