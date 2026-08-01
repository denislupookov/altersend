import { describe, expect, it } from 'vitest'
import { exceedsWebLinkLimit, WEB_LINK_MAX_BYTES } from './transfer'

describe('web link size limit', () => {
  it('caps the web link at 10 GB', () => {
    expect(WEB_LINK_MAX_BYTES).toBe(10 * 1024 ** 3)
  })

  it('allows transfers at or below the limit', () => {
    expect(exceedsWebLinkLimit(0)).toBe(false)
    expect(exceedsWebLinkLimit(1024)).toBe(false)
    expect(exceedsWebLinkLimit(WEB_LINK_MAX_BYTES - 1)).toBe(false)
    expect(exceedsWebLinkLimit(WEB_LINK_MAX_BYTES)).toBe(false)
  })

  it('blocks transfers over the limit', () => {
    expect(exceedsWebLinkLimit(WEB_LINK_MAX_BYTES + 1)).toBe(true)
    expect(exceedsWebLinkLimit(11 * 1024 ** 3)).toBe(true)
  })
})
