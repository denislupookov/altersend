import { createContext, useContext, useState, type ReactNode } from 'react'
import { css, html } from 'react-strict-dom'
import { darkTheme } from './themes/dark'
import { lightTheme } from './themes/light'
import { darkThemeStyle } from './themes/dark.css'
import { lightThemeStyle } from './themes/light.css'
import { BUNDLED_FONT_FAMILIES, DEFAULT_FONT_FAMILY_KEY, type FontFamilyKey } from './fonts'
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

function getFontFamilyName(fontFamily: FontFamilyKey) {
  return (
    BUNDLED_FONT_FAMILIES[fontFamily]?.cssFamily ??
    BUNDLED_FONT_FAMILIES[DEFAULT_FONT_FAMILY_KEY].cssFamily
  )
}

interface ThemeContextValue {
  theme: Theme
  themeType: ThemeType
  fontFamily: FontFamilyKey
  fontFamilyName: string
  setTheme: (theme: ThemeType) => void
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: darkTheme,
  themeType: ThemeType.Dark,
  fontFamily: DEFAULT_FONT_FAMILY_KEY,
  fontFamilyName: BUNDLED_FONT_FAMILIES[DEFAULT_FONT_FAMILY_KEY].cssFamily,
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
  const fontFamilyName = getFontFamilyName(fontFamily)

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
        style={[themeStyle, fontThemeStyle] as unknown as HtmlDivStyle}
      >
        <html.div style={styles.root}>{children}</html.div>
      </html.div>
    </ThemeContext.Provider>
  )
}

export function useTheme(): ThemeContextValue {
  return useContext(ThemeContext)
}
