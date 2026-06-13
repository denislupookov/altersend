import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { css, html } from 'react-strict-dom'
import { darkTheme } from './themes/dark'
import { lightTheme } from './themes/light'
import { darkThemeStyle } from './themes/dark.css'
import { lightThemeStyle } from './themes/light.css'
import { DEFAULT_FONT_FAMILY_KEY, getNativeFontFamilyName, type FontFamilyKey } from './fonts'
import { getFontFamilyCssVariables, type FontFamilyCssVariables } from './fontCssVariables'
import { fontThemeStyles } from './fontThemes.css'
import type { Theme } from './types'
import { ThemeType } from './types'

type HtmlDivStyle = NonNullable<Parameters<typeof html.div>[0]['style']>

function getTheme(type: ThemeType): Theme {
  switch (type) {
    case ThemeType.Light:
      return lightTheme
    case ThemeType.Dark:
    default:
      return darkTheme
  }
}

function getThemeStyle(type: ThemeType) {
  switch (type) {
    case ThemeType.Light:
      return lightThemeStyle
    case ThemeType.Dark:
    default:
      return darkThemeStyle
  }
}

function getFontThemeStyle(fontFamily: FontFamilyKey) {
  return fontThemeStyles[fontFamily] ?? fontThemeStyles[DEFAULT_FONT_FAMILY_KEY]
}

const FONT_CUSTOM_PROPERTIES = [
  '--as-font-family-sans',
  '--as-font-family-display',
  '--as-font-family-mono'
] as const

interface FontRootSnapshot {
  element: HTMLElement
  customProperties: Record<(typeof FONT_CUSTOM_PROPERTIES)[number], string>
  fontFamily: string
}

function applyFontFamilyCssVariables(element: HTMLElement, variables: FontFamilyCssVariables) {
  for (const property of FONT_CUSTOM_PROPERTIES) {
    element.style.setProperty(property, variables[property])
  }
  element.style.fontFamily = variables.fontFamily
}

function snapshotFontRoot(element: HTMLElement): FontRootSnapshot {
  return {
    element,
    customProperties: {
      '--as-font-family-sans': element.style.getPropertyValue('--as-font-family-sans'),
      '--as-font-family-display': element.style.getPropertyValue('--as-font-family-display'),
      '--as-font-family-mono': element.style.getPropertyValue('--as-font-family-mono')
    },
    fontFamily: element.style.fontFamily
  }
}

function restoreFontRoot(snapshot: FontRootSnapshot) {
  for (const property of FONT_CUSTOM_PROPERTIES) {
    const value = snapshot.customProperties[property]
    if (value) snapshot.element.style.setProperty(property, value)
    else snapshot.element.style.removeProperty(property)
  }
  snapshot.element.style.fontFamily = snapshot.fontFamily
}

interface ThemeContextValue {
  theme: Theme
  themeType: ThemeType
  fontFamily: FontFamilyKey
  fontFamilyName: string | undefined
  setTheme: (theme: ThemeType) => void
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: darkTheme,
  themeType: ThemeType.Dark,
  fontFamily: DEFAULT_FONT_FAMILY_KEY,
  fontFamilyName: getNativeFontFamilyName(DEFAULT_FONT_FAMILY_KEY),
  setTheme: () => {}
})

interface ThemeProviderProps {
  theme?: ThemeType
  fontFamily?: FontFamilyKey
  children: ReactNode
}

const styles = css.create({
  root: {
    minHeight: '100%',
    width: '100%',
    display: 'flex',
    flexDirection: 'column'
  }
})

export function ThemeProvider({
  theme: initialTheme = ThemeType.Dark,
  fontFamily = DEFAULT_FONT_FAMILY_KEY,
  children
}: ThemeProviderProps) {
  const [themeType, setThemeType] = useState<ThemeType>(initialTheme)
  const themeStyle = getThemeStyle(themeType)
  const fontThemeStyle = getFontThemeStyle(fontFamily)
  const fontFamilyName = getNativeFontFamilyName(fontFamily)
  const fontRootStyle = useMemo(() => getFontFamilyCssVariables(fontFamily), [fontFamily])

  useEffect(() => {
    if (typeof document === 'undefined') return

    const roots = [document.documentElement, document.body].filter(Boolean)
    const snapshots = roots.map(snapshotFontRoot)
    roots.forEach((root) => applyFontFamilyCssVariables(root, fontRootStyle))

    return () => snapshots.forEach(restoreFontRoot)
  }, [fontRootStyle])

  return (
    <ThemeContext.Provider
      value={{
        theme: getTheme(themeType),
        themeType,
        fontFamily,
        fontFamilyName,
        setTheme: setThemeType
      }}
    >
      <html.div
        data-theme={themeType}
        style={[themeStyle, fontThemeStyle, fontRootStyle] as unknown as HtmlDivStyle}
      >
        <html.div style={styles.root}>{children}</html.div>
      </html.div>
    </ThemeContext.Provider>
  )
}

export function useTheme(): ThemeContextValue {
  return useContext(ThemeContext)
}
