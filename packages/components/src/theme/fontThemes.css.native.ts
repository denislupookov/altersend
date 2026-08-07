import { css } from 'react-strict-dom'
import { fontTokens } from './tokens.css'
import type { FontFamilyKey } from './fonts'

type FontThemeStyle = ReturnType<typeof css.createTheme>

const nativeSystemFontFamily = 'System'

const latinFontThemeStyle = css.createTheme(fontTokens, {
  fontFamilySans: nativeSystemFontFamily,
  fontFamilyDisplay: nativeSystemFontFamily,
  fontFamilyMono: 'monospace'
})

const japaneseFontThemeStyle = css.createTheme(fontTokens, {
  fontFamilySans: 'AlterSend Sans JP',
  fontFamilyDisplay: 'AlterSend Sans JP',
  fontFamilyMono: 'monospace'
})

const koreanFontThemeStyle = css.createTheme(fontTokens, {
  fontFamilySans: 'AlterSend Sans KR',
  fontFamilyDisplay: 'AlterSend Sans KR',
  fontFamilyMono: 'monospace'
})

const simplifiedChineseFontThemeStyle = css.createTheme(fontTokens, {
  fontFamilySans: 'AlterSend Sans SC',
  fontFamilyDisplay: 'AlterSend Sans SC',
  fontFamilyMono: 'monospace'
})

const traditionalChineseFontThemeStyle = css.createTheme(fontTokens, {
  fontFamilySans: 'AlterSend Sans TC',
  fontFamilyDisplay: 'AlterSend Sans TC',
  fontFamilyMono: 'monospace'
})

export const fontThemeStyles = {
  latin: latinFontThemeStyle,
  japanese: japaneseFontThemeStyle,
  korean: koreanFontThemeStyle,
  simplifiedChinese: simplifiedChineseFontThemeStyle,
  traditionalChinese: traditionalChineseFontThemeStyle
} satisfies Record<FontFamilyKey, FontThemeStyle>
