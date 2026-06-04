import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

import { rawTokens } from './tokens.raw'
import tokenSource from './tokens.json'

const koreanFallbacks = ['Apple SD Gothic Neo', 'Malgun Gothic', 'Noto Sans CJK KR', 'Noto Sans KR']

describe('font family tokens', () => {
  it('include Korean-capable fallbacks in primary UI stacks', () => {
    const { fontFamilySans, fontFamilyDisplay } = rawTokens.fontFamily

    for (const fallback of koreanFallbacks) {
      expect(fontFamilySans).toContain(fallback)
      expect(fontFamilyDisplay).toContain(fallback)
    }
  })

  it('keeps native UI font stacks compatible with React Native', () => {
    const nativeTokenSource = readFileSync(
      new URL('./tokens.css.native.ts', import.meta.url),
      'utf8'
    )

    expect(nativeTokenSource).toContain('export const nativeFontFamilies')

    for (const stack of Object.values(tokenSource.fontFamilyNative)) {
      for (const fontFamily of Object.values(stack)) {
        expect(fontFamily).not.toContain(',')
        expect(fontFamily).not.toContain('"')
      }
    }
  })
})
