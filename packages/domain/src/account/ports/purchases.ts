import type { BillingPlan, PlanOffer } from '../core'

export type PurchaseOutcome = 'bought' | 'owned' | 'pending' | 'cancelled'

export interface PurchaseAdapter {
  available(): Promise<boolean>
  offers(): Promise<PlanOffer[]>
  managementUrl(): Promise<string | null>
  identify(code: string): Promise<void>
  buy(plan: BillingPlan): Promise<PurchaseOutcome>
  restore(): Promise<boolean>
}
