import {
  BUNDLED_FONT_FAMILIES,
  DEFAULT_FONT_FAMILY_KEY,
  MONO_FONT_FAMILY_CSS,
  type FontFamilyKey
} from './fonts'

export interface FontFamilyCssVariables {
  '--as-font-family-sans': string
  '--as-font-family-display': string
  '--as-font-family-mono': string
  fontFamily: string
}

function getBundledCssFamily(fontFamily: FontFamilyKey) {
  return (
    BUNDLED_FONT_FAMILIES[fontFamily]?.cssFamily ??
    BUNDLED_FONT_FAMILIES[DEFAULT_FONT_FAMILY_KEY].cssFamily
  )
}

function quoteFontFamily(cssFamily: string) {
  return `"${cssFamily.replace(/"/g, '\\"')}"`
}

function getCssFontFamilyValue(cssFamily: string) {
  return cssFamily.includes(',') ? cssFamily : quoteFontFamily(cssFamily)
}

export function getFontFamilyCssVariables(fontFamily: FontFamilyKey): FontFamilyCssVariables {
  const cssFamily = getBundledCssFamily(fontFamily)
  const cssFontFamily = getCssFontFamilyValue(cssFamily)

  return {
    '--as-font-family-sans': cssFontFamily,
    '--as-font-family-display': cssFontFamily,
    '--as-font-family-mono': MONO_FONT_FAMILY_CSS,
    fontFamily: cssFamily
  }
}
