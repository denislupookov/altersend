import {
  NATIVE_RELAY_MAX_LABEL,
  PRO_PRICE_MONTHLY,
  PRO_PRICE_YEARLY,
  WEB_LINK_MAX_LABEL
} from '../../constants/transfer'
import type { BillingPlan } from './billing'

export type TranslateFn = (key: string, values?: Record<string, string | number>) => string

export interface PlanOffer {
  plan: BillingPlan
  price: string
}

export type PlanPrices = Partial<Record<BillingPlan, string>>

export function pricesFrom(offers: PlanOffer[]): PlanPrices {
  const prices: PlanPrices = {}
  for (const offer of offers) prices[offer.plan] = offer.price
  return prices
}

export const UNLIMITED = '∞'

export const BILLING_PLANS: BillingPlan[] = ['monthly', 'yearly']

const PLAN_LABEL_KEY: Record<BillingPlan, string> = {
  monthly: 'settings:account.planMonthly',
  yearly: 'settings:account.planYearly'
}

const PLAN_PRICE: Record<BillingPlan, string | null> = {
  monthly: PRO_PRICE_MONTHLY,
  yearly: PRO_PRICE_YEARLY
}

export interface PlanComparisonRow {
  label: string
  free: string
  pro: string
}

export function planLabel(plan: BillingPlan, t: TranslateFn, prices?: PlanPrices): string {
  const name = t(PLAN_LABEL_KEY[plan])
  const price = prices?.[plan] ?? PLAN_PRICE[plan]
  return price ? `${name} · ${price}` : name
}

export const INCLUDED = '✓'

export function planComparisonRows(t: TranslateFn): PlanComparisonRow[] {
  return [
    {
      label: t('settings:account.featurePriority'),
      free: t('settings:account.none'),
      pro: INCLUDED
    },
    {
      label: t('settings:account.featureWebCap'),
      free: WEB_LINK_MAX_LABEL,
      pro: UNLIMITED
    },
    {
      label: t('settings:account.featureAppCap'),
      free: NATIVE_RELAY_MAX_LABEL,
      pro: UNLIMITED
    }
  ]
}
