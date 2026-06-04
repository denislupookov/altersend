import { css } from 'react-strict-dom'
import { tokens } from './tokens.css'
import type { FontFamilyKey } from './fonts'

type FontThemeStyle = ReturnType<typeof css.createTheme>

const latinFontThemeStyle = css.createTheme(tokens, {
  fontFamilySans: 'AlterSend Sans',
  fontFamilyDisplay: 'AlterSend Sans',
  fontFamilyMono: 'AlterSend Sans'
})

const japaneseFontThemeStyle = css.createTheme(tokens, {
  fontFamilySans: 'AlterSend Sans JP',
  fontFamilyDisplay: 'AlterSend Sans JP',
  fontFamilyMono: 'AlterSend Sans JP'
})

const koreanFontThemeStyle = css.createTheme(tokens, {
  fontFamilySans: 'AlterSend Sans KR',
  fontFamilyDisplay: 'AlterSend Sans KR',
  fontFamilyMono: 'AlterSend Sans KR'
})

const simplifiedChineseFontThemeStyle = css.createTheme(tokens, {
  fontFamilySans: 'AlterSend Sans SC',
  fontFamilyDisplay: 'AlterSend Sans SC',
  fontFamilyMono: 'AlterSend Sans SC'
})

const traditionalChineseFontThemeStyle = css.createTheme(tokens, {
  fontFamilySans: 'AlterSend Sans TC',
  fontFamilyDisplay: 'AlterSend Sans TC',
  fontFamilyMono: 'AlterSend Sans TC'
})

export const fontThemeStyles = {
  latin: latinFontThemeStyle,
  japanese: japaneseFontThemeStyle,
  korean: koreanFontThemeStyle,
  simplifiedChinese: simplifiedChineseFontThemeStyle,
  traditionalChinese: traditionalChineseFontThemeStyle
} satisfies Record<FontFamilyKey, FontThemeStyle>
