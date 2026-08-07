import { useEffect, useState } from 'react'
import { ThemeType } from './types'

const DARK_QUERY = '(prefers-color-scheme: dark)'

function matchDarkQuery(): MediaQueryList | null {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return null
  return window.matchMedia(DARK_QUERY)
}

export function getSystemTheme(): ThemeType {
  return matchDarkQuery()?.matches === false ? ThemeType.Light : ThemeType.Dark
}

export function useSystemTheme(): ThemeType {
  const [systemTheme, setSystemTheme] = useState<ThemeType>(getSystemTheme)

  useEffect(() => {
    const query = matchDarkQuery()
    if (!query) return

    const handleChange = (event: MediaQueryListEvent) =>
      setSystemTheme(event.matches ? ThemeType.Dark : ThemeType.Light)

    query.addEventListener('change', handleChange)
    return () => query.removeEventListener('change', handleChange)
  }, [])

  return systemTheme
}
