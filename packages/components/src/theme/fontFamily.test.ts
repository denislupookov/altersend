import { existsSync, readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

import {
  BUNDLED_FONT_FAMILIES,
  LATIN_FONT_FAMILY_CSS,
  MONO_FONT_FAMILY_CSS,
  MONO_FONT_FAMILY_NATIVE,
  getNativeFontFamilyName
} from './fonts'
import { getFontFamilyCssVariables } from './fontCssVariables'
import { rawTokens } from './tokens.raw'
import tokenSource from './tokens.json'

describe('font family tokens', () => {
  it('uses the native Latin stack for default sans and display UI text', () => {
    expect(rawTokens.fontFamily.fontFamilySans).toBe(LATIN_FONT_FAMILY_CSS)
    expect(rawTokens.fontFamily.fontFamilyDisplay).toBe(LATIN_FONT_FAMILY_CSS)
    expect(rawTokens.fontFamily.fontFamilySans).not.toContain('AlterSend Sans')
    expect(rawTokens.fontFamily.fontFamilyDisplay).not.toContain('AlterSend Sans')
  })

  it('uses a true monospace stack for mono UI text', () => {
    expect(rawTokens.fontFamily.fontFamilyMono).toBe(MONO_FONT_FAMILY_CSS)
    expect(rawTokens.fontFamily.fontFamilyMono).toContain('monospace')
    expect(rawTokens.fontFamily.fontFamilyMono).toContain('"SFMono-Regular"')
    expect(rawTokens.fontFamily.fontFamilyMono).toContain('"Menlo"')
    expect(rawTokens.fontFamily.fontFamilyMono).toContain('"Monaco"')
    expect(rawTokens.fontFamily.fontFamilyMono).toContain('"Consolas"')
    expect(rawTokens.fontFamily.fontFamilyMono).toContain(',')
  })

  it('declares bundled font assets only for CJK script families', () => {
    expect(Object.keys(BUNDLED_FONT_FAMILIES).sort()).toEqual([
      'japanese',
      'korean',
      'latin',
      'simplifiedChinese',
      'traditionalChinese'
    ])
    expect(BUNDLED_FONT_FAMILIES.latin.assetFileName).toBeUndefined()
    expect(getNativeFontFamilyName('latin')).toBeUndefined()

    for (const font of Object.values(BUNDLED_FONT_FAMILIES).filter((item) => item.assetFileName)) {
      expect(font.cssFamily).toMatch(/^AlterSend Sans/)
      expect(font.assetFileName).toMatch(/\.(ttf|otf)$/)
      expect(
        existsSync(new URL(`../../../../assets/fonts/${font.assetFileName}`, import.meta.url))
      ).toBe(true)

      if (font.boldAssetFileName) {
        expect(font.boldAssetFileName).toMatch(/\.(ttf|otf)$/)
        expect(
          existsSync(new URL(`../../../../assets/fonts/${font.boldAssetFileName}`, import.meta.url))
        ).toBe(true)
      }
    }
  })

  it('uses static regular and bold CJK font assets for native weight rendering', () => {
    expect(BUNDLED_FONT_FAMILIES.japanese).toMatchObject({
      assetFileName: 'NotoSans-JP-Regular.ttf',
      boldAssetFileName: 'NotoSans-JP-Bold.ttf'
    })
    expect(BUNDLED_FONT_FAMILIES.korean).toMatchObject({
      assetFileName: 'NotoSans-KR-Regular.ttf',
      boldAssetFileName: 'NotoSans-KR-Bold.ttf'
    })
    expect(BUNDLED_FONT_FAMILIES.simplifiedChinese).toMatchObject({
      assetFileName: 'NotoSans-SC-Regular.ttf',
      boldAssetFileName: 'NotoSans-SC-Bold.ttf'
    })
    expect(BUNDLED_FONT_FAMILIES.traditionalChinese).toMatchObject({
      assetFileName: 'NotoSans-TC-Regular.ttf',
      boldAssetFileName: 'NotoSans-TC-Bold.ttf'
    })
  })

  it('keeps native UI font stacks compatible with React Native', () => {
    const nativeTokenSource = readFileSync(
      new URL('./tokens.css.native.ts', import.meta.url),
      'utf8'
    )

    expect(nativeTokenSource).toContain('export const nativeFontFamilies')

    expect(tokenSource.fontFamilyNative.ios.fontFamilyMono).toBe(MONO_FONT_FAMILY_NATIVE.ios)
    expect(tokenSource.fontFamilyNative.android.fontFamilyMono).toBe(
      MONO_FONT_FAMILY_NATIVE.android
    )
    expect(tokenSource.fontFamilyNative.default.fontFamilyMono).toBe(
      MONO_FONT_FAMILY_NATIVE.default
    )
    expect(tokenSource.fontFamilyNative.ios.fontFamilySans).toBe('System')
    expect(tokenSource.fontFamilyNative.ios.fontFamilyDisplay).toBe('System')
    expect(tokenSource.fontFamilyNative.android.fontFamilySans).toBe('System')
    expect(tokenSource.fontFamilyNative.android.fontFamilyDisplay).toBe('System')

    for (const stack of Object.values(tokenSource.fontFamilyNative)) {
      for (const fontFamily of Object.values(stack)) {
        expect(fontFamily).not.toContain(',')
        expect(fontFamily).not.toContain('"')
      }
    }
  })

  it('keeps mobile Metro pointed at component source so Android Input is selectable', () => {
    const metroSource = readFileSync(
      new URL('../../../../apps/mobile/metro.config.js', import.meta.url),
      'utf8'
    )

    expect(metroSource).toContain("'@altersend/components'")
    expect(metroSource).toContain('packages/components/src/index.ts')
    expect(metroSource).toContain('resolveRequest')
  })

  it('does not pass CSS-quoted font family names to React Native font themes', () => {
    const webFontThemeSource = readFileSync(new URL('./fontThemes.css.ts', import.meta.url), 'utf8')
    const nativeFontThemeSource = readFileSync(
      new URL('./fontThemes.css.native.ts', import.meta.url),
      'utf8'
    )

    expect(webFontThemeSource).toContain('fontFamilySans: \'"AlterSend Sans KR"\'')
    expect(webFontThemeSource).toContain('fontFamilyMono:\n    \'ui-monospace, "SFMono-Regular"')
    expect(webFontThemeSource).not.toContain('MONO_FONT_FAMILY_CSS')
    expect(nativeFontThemeSource).toContain("fontFamilySans: 'AlterSend Sans KR'")
    expect(nativeFontThemeSource).toContain("fontFamilyMono: 'monospace'")
    expect(nativeFontThemeSource).not.toContain('nativeMonoFontFamily')
    expect(nativeFontThemeSource).not.toContain('fontFamilySans: \'"AlterSend Sans KR"\'')
  })

  it('exposes Korean CSS variables for Tailwind and plain DOM text', () => {
    const expectedFamilies = {
      latin: LATIN_FONT_FAMILY_CSS,
      japanese: 'AlterSend Sans JP',
      korean: 'AlterSend Sans KR',
      simplifiedChinese: 'AlterSend Sans SC',
      traditionalChinese: 'AlterSend Sans TC'
    } as const

    for (const [fontFamilyKey, cssFamily] of Object.entries(expectedFamilies)) {
      const expectedFamily = fontFamilyKey === 'latin' ? cssFamily : `"${cssFamily}"`
      expect(getFontFamilyCssVariables(fontFamilyKey as keyof typeof expectedFamilies)).toEqual({
        '--as-font-family-sans': expectedFamily,
        '--as-font-family-display': expectedFamily,
        '--as-font-family-mono': MONO_FONT_FAMILY_CSS,
        fontFamily: cssFamily
      })
    }
  })

  it('centralizes web font synchronization in ThemeProvider', () => {
    const themeContextSource = readFileSync(new URL('./ThemeContext.tsx', import.meta.url), 'utf8')

    expect(themeContextSource).toContain('getFontFamilyCssVariables')
    expect(themeContextSource).toContain('document.documentElement')
    expect(themeContextSource).toContain('document.body')
    expect(themeContextSource).toContain('fontThemeStyle')
  })
})
