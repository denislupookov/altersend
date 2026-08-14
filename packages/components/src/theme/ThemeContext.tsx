import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { css, html } from 'react-strict-dom'
import { darkTheme } from './themes/dark'
import { lightTheme } from './themes/light'
import { darkThemeStyle } from './themes/dark.css'
import { lightThemeStyle } from './themes/light.css'
import { DEFAULT_FONT_FAMILY_KEY, getNativeFontFamilyName, type FontFamilyKey } from './fonts'
import { getFontFamilyCssVariables, type FontFamilyCssVariables } from './fontCssVariables'
import { fontThemeStyles } from './fontThemes.css'
import { useSystemTheme } from './useSystemTheme'
import { applyDocumentTheme } from './documentTheme'
import {
  SYSTEM_THEME_PREFERENCE,
  resolveThemePreference,
  type ThemePreference
} from './themePreference'
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

const THEME_ROOT_ID = 'as-theme-root'

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
  themePreference: ThemePreference
  fontFamily: FontFamilyKey
  fontFamilyName: string | undefined
  setThemePreference: (preference: ThemePreference) => void
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: darkTheme,
  themeType: ThemeType.Dark,
  themePreference: SYSTEM_THEME_PREFERENCE,
  fontFamily: DEFAULT_FONT_FAMILY_KEY,
  fontFamilyName: getNativeFontFamilyName(DEFAULT_FONT_FAMILY_KEY),
  setThemePreference: () => {}
})

interface ThemeProviderProps {
  preference?: ThemePreference
  onPreferenceChange?: (preference: ThemePreference) => void
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
  preference: initialPreference = SYSTEM_THEME_PREFERENCE,
  onPreferenceChange,
  fontFamily = DEFAULT_FONT_FAMILY_KEY,
  children
}: ThemeProviderProps) {
  const [themePreference, setThemePreferenceState] = useState<ThemePreference>(initialPreference)
  const systemTheme = useSystemTheme()
  const themeType = resolveThemePreference(themePreference, systemTheme)
  const themeStyle = getThemeStyle(themeType)
  const fontThemeStyle = getFontThemeStyle(fontFamily)
  const fontFamilyName = getNativeFontFamilyName(fontFamily)
  const fontRootStyle = useMemo(() => getFontFamilyCssVariables(fontFamily), [fontFamily])

  useEffect(() => setThemePreferenceState(initialPreference), [initialPreference])

  useEffect(() => {
    if (typeof document === 'undefined') return

    const roots = [document.documentElement, document.body].filter(Boolean)
    const snapshots = roots.map(snapshotFontRoot)
    roots.forEach((root) => applyFontFamilyCssVariables(root, fontRootStyle))

    return () => snapshots.forEach(restoreFontRoot)
  }, [fontRootStyle])

  useEffect(() => applyDocumentTheme(themeType), [themeType])

  useEffect(() => {
    if (typeof document === 'undefined') return

    const themeRoot = document.getElementById(THEME_ROOT_ID)
    if (!themeRoot) return

    const themeClasses = Array.from(themeRoot.classList)
    document.body.classList.add(...themeClasses)

    return () => document.body.classList.remove(...themeClasses)
  }, [themeStyle, fontThemeStyle])

  const setThemePreference = (next: ThemePreference) => {
    setThemePreferenceState(next)
    onPreferenceChange?.(next)
  }

  return (
    <ThemeContext.Provider
      value={{
        theme: getTheme(themeType),
        themeType,
        themePreference,
        fontFamily,
        fontFamilyName,
        setThemePreference
      }}
    >
      <html.div
        data-theme={themeType}
        id={THEME_ROOT_ID}
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
