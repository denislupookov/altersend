import { describe, expect, it } from 'vitest'
import { localDay, ratingDue } from './ratingCooldown'

describe('ratingDue', () => {
  it('asks someone who never rated', () => {
    expect(ratingDue(null, '2026-11-16')).toBe(true)
  })

  it('holds off within a year of rating', () => {
    expect(ratingDue('2026-11-16', '2026-11-16')).toBe(false)
    expect(ratingDue('2025-11-17', '2026-11-16')).toBe(false)
  })

  it('asks again once a year has passed', () => {
    expect(ratingDue('2025-11-16', '2026-11-16')).toBe(true)
  })

  it('holds off when the clock moved back', () => {
    expect(ratingDue('2027-01-01', '2026-11-16')).toBe(false)
  })

  it('asks when the stored day is unreadable', () => {
    expect(ratingDue('garbage', '2026-11-16')).toBe(true)
  })
})

describe('localDay', () => {
  it('formats the local calendar day', () => {
    expect(localDay(new Date(2026, 0, 5, 23, 59))).toBe('2026-01-05')
  })
})
