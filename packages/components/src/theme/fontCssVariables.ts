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

export function getFontFamilyCssVariables(fontFamily: FontFamilyKey): FontFamilyCssVariables {
  const cssFamily = getBundledCssFamily(fontFamily)
  const quotedCssFamily = quoteFontFamily(cssFamily)

  return {
    '--as-font-family-sans': quotedCssFamily,
    '--as-font-family-display': quotedCssFamily,
    '--as-font-family-mono': MONO_FONT_FAMILY_CSS,
    fontFamily: cssFamily
  }
}
