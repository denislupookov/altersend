import type { ThemeType } from './types'

export function applyDocumentTheme(themeType: ThemeType): void {
  if (typeof document === 'undefined') return

  const root = document.documentElement
  root.setAttribute('data-theme', themeType)
  root.style.colorScheme = themeType
}
