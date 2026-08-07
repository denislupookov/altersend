import { rawTokens } from './tokens.raw'
import type { ThemeType } from './types'

export function applyDocumentTheme(themeType: ThemeType): void {
  if (typeof document === 'undefined') return

  const root = document.documentElement
  root.setAttribute('data-theme', themeType)
  root.style.colorScheme = themeType

  document
    .querySelector('meta[name="theme-color"]')
    ?.setAttribute('content', rawTokens.colors[themeType].colorBackground)
}
