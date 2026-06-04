import { existsSync, readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

import { BUNDLED_FONT_FAMILIES } from './fonts'
import { rawTokens } from './tokens.raw'
import tokenSource from './tokens.json'

const osFallbackNames = [
  'SF Pro Text',
  'SF Pro Display',
  'Segoe UI',
  'Apple SD Gothic Neo',
  'Malgun Gothic',
  'Noto Sans CJK KR',
  'Noto Sans KR',
  'Hiragino Sans',
  'Yu Gothic',
  'PingFang SC',
  'PingFang TC',
  'Microsoft YaHei',
  'Microsoft JhengHei',
  'Helvetica Neue',
  'Arial',
  'sans-serif',
  'System',
  'Menlo',
  'monospace'
]

describe('font family tokens', () => {
  it('uses bundled AlterSend font families instead of OS fallback stacks', () => {
    for (const fontFamily of Object.values(rawTokens.fontFamily)) {
      expect(fontFamily).toMatch(/^"AlterSend Sans/)
      expect(fontFamily).not.toContain(',')

      for (const fallbackName of osFallbackNames) {
        expect(fontFamily).not.toContain(fallbackName)
      }
    }
  })

  it('declares bundled font assets for every supported script family', () => {
    expect(Object.keys(BUNDLED_FONT_FAMILIES).sort()).toEqual([
      'japanese',
      'korean',
      'latin',
      'simplifiedChinese',
      'traditionalChinese'
    ])

    for (const font of Object.values(BUNDLED_FONT_FAMILIES)) {
      expect(font.cssFamily).toMatch(/^AlterSend Sans/)
      expect(font.assetFileName).toMatch(/\.(ttf|otf)$/)
      expect(
        existsSync(new URL(`../../../../assets/fonts/${font.assetFileName}`, import.meta.url))
      ).toBe(true)
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
        expect(fontFamily).toMatch(/^AlterSend Sans/)
      }
    }
  })

  it('does not pass CSS-quoted font family names to React Native font themes', () => {
    const webFontThemeSource = readFileSync(new URL('./fontThemes.css.ts', import.meta.url), 'utf8')
    const nativeFontThemeSource = readFileSync(
      new URL('./fontThemes.css.native.ts', import.meta.url),
      'utf8'
    )

    expect(webFontThemeSource).toContain('fontFamilySans: \'"AlterSend Sans KR"\'')
    expect(nativeFontThemeSource).toContain("fontFamilySans: 'AlterSend Sans KR'")
    expect(nativeFontThemeSource).not.toContain('fontFamilySans: \'"AlterSend Sans KR"\'')
  })
})
