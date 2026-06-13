import { css } from 'react-strict-dom'
import { Platform } from 'react-native'
import { tokens } from './tokens.css'
import type { FontFamilyKey } from './fonts'

type FontThemeStyle = ReturnType<typeof css.createTheme>

const nativeSystemFontFamily =
  Platform.select({
    ios: 'System',
    android: 'sans-serif',
    default: 'sans-serif'
  }) ?? 'sans-serif'

const latinFontThemeStyle = css.createTheme(tokens, {
  fontFamilySans: nativeSystemFontFamily,
  fontFamilyDisplay: nativeSystemFontFamily,
  fontFamilyMono: 'monospace'
})

const japaneseFontThemeStyle = css.createTheme(tokens, {
  fontFamilySans: 'AlterSend Sans JP',
  fontFamilyDisplay: 'AlterSend Sans JP',
  fontFamilyMono: 'monospace'
})

const koreanFontThemeStyle = css.createTheme(tokens, {
  fontFamilySans: 'AlterSend Sans KR',
  fontFamilyDisplay: 'AlterSend Sans KR',
  fontFamilyMono: 'monospace'
})

const simplifiedChineseFontThemeStyle = css.createTheme(tokens, {
  fontFamilySans: 'AlterSend Sans SC',
  fontFamilyDisplay: 'AlterSend Sans SC',
  fontFamilyMono: 'monospace'
})

const traditionalChineseFontThemeStyle = css.createTheme(tokens, {
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
