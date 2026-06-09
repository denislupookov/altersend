import { css } from 'react-strict-dom'
import { tokens } from './tokens.css'
import type { FontFamilyKey } from './fonts'

type FontThemeStyle = ReturnType<typeof css.createTheme>

const latinFontThemeStyle = css.createTheme(tokens, {
  fontFamilySans: 'AlterSend Sans',
  fontFamilyDisplay: 'AlterSend Sans',
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
