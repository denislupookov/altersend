import { css } from 'react-strict-dom'
import { tokens } from './tokens.css'
import type { FontFamilyKey } from './fonts'

type FontThemeStyle = ReturnType<typeof css.createTheme>

const latinFontThemeStyle = css.createTheme(tokens, {
  fontFamilySans:
    '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Helvetica Neue", Helvetica, system-ui, sans-serif',
  fontFamilyDisplay:
    '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Helvetica Neue", Helvetica, system-ui, sans-serif',
  fontFamilyMono:
    'ui-monospace, "SFMono-Regular", "Menlo", "Monaco", "Consolas", "Liberation Mono", "Courier New", monospace'
})

const japaneseFontThemeStyle = css.createTheme(tokens, {
  fontFamilySans: '"AlterSend Sans JP"',
  fontFamilyDisplay: '"AlterSend Sans JP"',
  fontFamilyMono:
    'ui-monospace, "SFMono-Regular", "Menlo", "Monaco", "Consolas", "Liberation Mono", "Courier New", monospace'
})

const koreanFontThemeStyle = css.createTheme(tokens, {
  fontFamilySans: '"AlterSend Sans KR"',
  fontFamilyDisplay: '"AlterSend Sans KR"',
  fontFamilyMono:
    'ui-monospace, "SFMono-Regular", "Menlo", "Monaco", "Consolas", "Liberation Mono", "Courier New", monospace'
})

const simplifiedChineseFontThemeStyle = css.createTheme(tokens, {
  fontFamilySans: '"AlterSend Sans SC"',
  fontFamilyDisplay: '"AlterSend Sans SC"',
  fontFamilyMono:
    'ui-monospace, "SFMono-Regular", "Menlo", "Monaco", "Consolas", "Liberation Mono", "Courier New", monospace'
})

const traditionalChineseFontThemeStyle = css.createTheme(tokens, {
  fontFamilySans: '"AlterSend Sans TC"',
  fontFamilyDisplay: '"AlterSend Sans TC"',
  fontFamilyMono:
    'ui-monospace, "SFMono-Regular", "Menlo", "Monaco", "Consolas", "Liberation Mono", "Courier New", monospace'
})

export const fontThemeStyles = {
  latin: latinFontThemeStyle,
  japanese: japaneseFontThemeStyle,
  korean: koreanFontThemeStyle,
  simplifiedChinese: simplifiedChineseFontThemeStyle,
  traditionalChinese: traditionalChineseFontThemeStyle
} satisfies Record<FontFamilyKey, FontThemeStyle>
