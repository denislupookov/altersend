import { describe, expect, it } from 'vitest'
import { subscriptionSummary, type SubscriptionSummaryInput } from './summary'

const t = (key: string, values?: Record<string, string | number>) =>
  values ? `${key}(${values.date})` : key

const formatDate = (value: string) => value.slice(0, 7)

const input = (overrides: Partial<SubscriptionSummaryInput> = {}): SubscriptionSummaryInput => ({
  cancelling: false,
  endsAt: null,
  validUntil: null,
  canOpen: false,
  ...overrides
})

describe('subscriptionSummary', () => {
  it('prefers the end date over the renewal date while cancelling', () => {
    const summary = input({ cancelling: true, endsAt: '2030-04-01', validUntil: '2030-05-01' })

    expect(subscriptionSummary(summary, t, formatDate)).toBe('settings:account.endsOn(2030-04)')
  })

  it('falls back to the renewal date when a cancellation has no end date', () => {
    const summary = input({ cancelling: true, validUntil: '2030-05-01' })

    expect(subscriptionSummary(summary, t, formatDate)).toBe('settings:account.untilDate(2030-05)')
  })

  it('appends the manage hint when the row is actionable', () => {
    const summary = input({ validUntil: '2030-05-01', canOpen: true })

    expect(subscriptionSummary(summary, t, formatDate)).toBe(
      'settings:account.untilDate(2030-05) · settings:account.manageSubscription'
    )
  })

  it('shows only the manage hint when no dates are known', () => {
    expect(subscriptionSummary(input({ canOpen: true }), t, formatDate)).toBe(
      'settings:account.manageSubscription'
    )
  })

  it('returns null when there is nothing to show', () => {
    expect(subscriptionSummary(input(), t, formatDate)).toBeNull()
  })
})
