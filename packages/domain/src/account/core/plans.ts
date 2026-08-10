import { NATIVE_RELAY_MAX_LABEL, WEB_LINK_MAX_LABEL } from '../../constants/transfer'
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

export type PlanCell = { type: 'text'; value: string } | { type: 'check' }

const cellText = (value: string): PlanCell => ({ type: 'text', value })

const UNLIMITED = cellText('∞')
const INCLUDED: PlanCell = { type: 'check' }

export const BILLING_PLANS: BillingPlan[] = ['monthly', 'yearly']

const PLAN_LABEL_KEY: Record<BillingPlan, string> = {
  monthly: 'settings:account.planMonthly',
  yearly: 'settings:account.planYearly'
}

export interface PlanComparisonRow {
  label: string
  free: PlanCell
  pro: PlanCell
}

const PLAN_PRICE_KEY: Record<BillingPlan, string> = {
  monthly: 'settings:account.pricePerMonth',
  yearly: 'settings:account.pricePerYear'
}

export function planLabel(plan: BillingPlan, t: TranslateFn, prices?: PlanPrices): string {
  const price = prices?.[plan]
  return price ? t(PLAN_PRICE_KEY[plan], { price }) : t(PLAN_LABEL_KEY[plan])
}

const PLAN_CAPTION_KEY: Record<BillingPlan, string> = {
  monthly: 'settings:account.billedMonthly',
  yearly: 'settings:account.billedYearly'
}

export interface PlanRow {
  plan: BillingPlan
  title: string
  caption: string
  price: string | null
}

export function planRows(t: TranslateFn, prices?: PlanPrices): PlanRow[] {
  return BILLING_PLANS.map((plan) => ({
    plan,
    title: t(PLAN_LABEL_KEY[plan]),
    caption: t(PLAN_CAPTION_KEY[plan]),
    price: prices?.[plan] ?? null
  }))
}

export function planComparisonRows(t: TranslateFn): PlanComparisonRow[] {
  return [
    {
      label: t('settings:account.featureDirect'),
      free: UNLIMITED,
      pro: UNLIMITED
    },
    {
      label: t('settings:account.featurePriority'),
      free: cellText(t('settings:account.none')),
      pro: INCLUDED
    },
    {
      label: t('settings:account.featureWebCap'),
      free: cellText(WEB_LINK_MAX_LABEL),
      pro: UNLIMITED
    },
    {
      label: t('settings:account.featureAppCap'),
      free: cellText(NATIVE_RELAY_MAX_LABEL),
      pro: UNLIMITED
    }
  ]
}
