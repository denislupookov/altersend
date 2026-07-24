import { describe, expect, it } from 'vitest'
import { MAX_DISPLAY_NAME_LEN } from '@altersend/core'
import { isRenameSubmittable } from './useDeviceRenameForm'

describe('isRenameSubmittable', () => {
  it('accepts a changed, non-empty name', () => {
    expect(isRenameSubmittable('Work Phone', 'Phone')).toBe(true)
  })

  it('rejects an empty or whitespace-only name', () => {
    expect(isRenameSubmittable('', 'Phone')).toBe(false)
    expect(isRenameSubmittable('   ', 'Phone')).toBe(false)
  })

  it('rejects a name that only differs by surrounding whitespace', () => {
    expect(isRenameSubmittable('  Phone  ', 'Phone')).toBe(false)
  })

  it('rejects a name past the remembered-peer bound', () => {
    expect(isRenameSubmittable('x'.repeat(MAX_DISPLAY_NAME_LEN), 'Phone')).toBe(true)
    expect(isRenameSubmittable('x'.repeat(MAX_DISPLAY_NAME_LEN + 1), 'Phone')).toBe(false)
  })

  it('measures length after trimming', () => {
    expect(isRenameSubmittable(` ${'x'.repeat(MAX_DISPLAY_NAME_LEN)} `, 'Phone')).toBe(true)
  })
})
