import { app, nativeTheme } from 'electron'
import { readFile } from 'fs/promises'
import path from 'path'
import { rawTokens } from '@altersend/components/theme/raw'
import { writeFileViaTemp } from './writeFileViaTemp.js'

export type ThemeSource = Electron.NativeTheme['themeSource']

interface StoredTheme {
  preference?: string
}

function storePath(): string {
  return path.join(app.getPath('userData'), 'theme.json')
}

function normalize(value: unknown): ThemeSource {
  return value === 'light' || value === 'dark' ? value : 'system'
}

export async function loadThemeSource(): Promise<ThemeSource> {
  try {
    const parsed = JSON.parse(await readFile(storePath(), 'utf8')) as StoredTheme
    return normalize(parsed.preference)
  } catch {
    return 'system'
  }
}

export function applyThemeSource(preference: ThemeSource): void {
  nativeTheme.themeSource = preference
}

let pendingWrite: Promise<unknown> = Promise.resolve()

export function setThemeSource(preference: ThemeSource): Promise<void> {
  const normalized = normalize(preference)
  applyThemeSource(normalized)

  const write = pendingWrite.then(() =>
    writeFileViaTemp(storePath(), JSON.stringify({ preference: normalized } satisfies StoredTheme))
  )
  pendingWrite = write.catch((error) => {
    console.warn('theme: could not persist preference', error)
  })

  return write
}

export function windowBackgroundColor(): string {
  const palette = nativeTheme.shouldUseDarkColors ? rawTokens.colors.dark : rawTokens.colors.light
  return palette.colorBackground
}
