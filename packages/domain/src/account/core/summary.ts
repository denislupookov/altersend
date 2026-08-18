import type { TranslateFn } from './plans'

export type FormatDateFn = (value: string) => string

export interface SubscriptionSummaryInput {
  cancelling: boolean
  endsAt: string | null
  validUntil: string | null
  canOpen: boolean
}

function periodLabel(
  { cancelling, endsAt, validUntil }: SubscriptionSummaryInput,
  t: TranslateFn,
  formatDate: FormatDateFn
): string | null {
  if (cancelling && endsAt) return t('settings:account.endsOn', { date: formatDate(endsAt) })
  if (validUntil) return t('settings:account.untilDate', { date: formatDate(validUntil) })
  return null
}

export function subscriptionSummary(
  input: SubscriptionSummaryInput,
  t: TranslateFn,
  formatDate: FormatDateFn
): string | null {
  const parts = [
    periodLabel(input, t, formatDate),
    input.canOpen ? t('settings:account.manageSubscription') : null
  ].filter((part): part is string => part !== null)

  return parts.length ? parts.join(' · ') : null
}
