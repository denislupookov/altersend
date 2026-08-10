import { useEffect, useState } from 'react'
import { pricesFrom, type PlanOffer, type PlanPrices } from '../core'
import type { PurchaseAdapter } from '../ports'
import type { AccountClient } from '../transport'

export function usePlanPrices(
  client: AccountClient,
  purchases?: PurchaseAdapter,
  storeRequested = true
): PlanPrices {
  const [prices, setPrices] = useState<PlanPrices>({})

  useEffect(() => {
    if (purchases && !storeRequested) return

    let cancelled = false

    const load = async (): Promise<PlanOffer[]> => {
      if (purchases) return purchases.offers()

      const listed = await client.prices()
      return listed.map((price) => ({ plan: price.plan, price: price.formatted }))
    }

    load()
      .then((offers) => {
        if (!cancelled) setPrices(pricesFrom(offers))
      })
      .catch((err) => console.warn('[account] loading prices failed', err))

    return () => {
      cancelled = true
    }
  }, [client, purchases, storeRequested])

  return prices
}
