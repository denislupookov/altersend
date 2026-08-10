import { nativeTheme } from 'electron'
import { rawTokens } from '@altersend/components/theme/raw'
import { createJsonStore } from './store/index.js'

export type ThemeSource = Electron.NativeTheme['themeSource']

interface StoredTheme {
  preference: ThemeSource
}

const store = createJsonStore<StoredTheme>('theme.json', { preference: 'system' })

function normalize(value: unknown): ThemeSource {
  return value === 'light' || value === 'dark' ? value : 'system'
}

export async function loadThemeSource(): Promise<ThemeSource> {
  return normalize((await store.read()).preference)
}

export function applyThemeSource(preference: ThemeSource): void {
  nativeTheme.themeSource = preference
}

export function setThemeSource(preference: ThemeSource): Promise<void> {
  const normalized = normalize(preference)
  applyThemeSource(normalized)
  return store.write({ preference: normalized })
}

export function windowBackgroundColor(): string {
  const palette = nativeTheme.shouldUseDarkColors ? rawTokens.colors.dark : rawTokens.colors.light
  return palette.colorBackground
}
