import { describe, expect, it } from 'vitest'
import { LANGUAGES, PICKABLE_LANGUAGES, getLanguage, isPickable, isRTL } from './languages'

describe('language registry', () => {
  it('registers English and Brazilian Portuguese', () => {
    expect(LANGUAGES.map((l) => l.code).sort()).toEqual(['en-US', 'pt-BR'])
  })

  it('only offers production-ready languages in the picker', () => {
    expect(PICKABLE_LANGUAGES.map((l) => l.code)).toEqual(['en-US'])
    expect(isPickable('en-US')).toBe(true)
    // pt-BR is registered but not production-ready yet → hidden from the picker.
    expect(isPickable('pt-BR')).toBe(false)
  })

  it('exposes label and direction metadata', () => {
    expect(getLanguage('en-US')).toMatchObject({ label: 'English', dir: 'ltr' })
    expect(getLanguage('pt-BR')).toMatchObject({ dir: 'ltr', productionReady: false })
    expect(getLanguage('xx')).toBeUndefined()
  })

  it('derives RTL from registry metadata', () => {
    expect(isRTL('en-US')).toBe(false)
    expect(isRTL('pt-BR')).toBe(false)
    // Unregistered tags are treated as LTR (they are never selectable anyway).
    expect(isRTL('ar')).toBe(false)
  })
})
