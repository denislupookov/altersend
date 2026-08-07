import {
  SYSTEM_THEME_PREFERENCE,
  normalizeThemePreference,
  type ThemePreference
} from '@altersend/components'
import { Directory, File, Paths } from 'expo-file-system'

const DIRNAME = 'altersend'
const FILENAME = 'theme.preference'
let themePreferenceSnapshot: ThemePreference = SYSTEM_THEME_PREFERENCE

export function getThemePreferenceSnapshot(): ThemePreference {
  return themePreferenceSnapshot
}

function getPreferenceFile(): File | null {
  const documentDirectory = Paths.document
  if (!documentDirectory?.uri) return null
  return new File(new Directory(documentDirectory, DIRNAME), FILENAME)
}

export async function getSavedThemePreference(): Promise<ThemePreference> {
  try {
    const file = getPreferenceFile()
    themePreferenceSnapshot = file?.exists
      ? normalizeThemePreference(await file.text())
      : SYSTEM_THEME_PREFERENCE
  } catch {
    themePreferenceSnapshot = SYSTEM_THEME_PREFERENCE
  }

  return themePreferenceSnapshot
}

export async function setSavedThemePreference(preference: ThemePreference): Promise<void> {
  themePreferenceSnapshot = normalizeThemePreference(preference)

  try {
    const documentDirectory = Paths.document
    if (!documentDirectory?.uri) return
    const dir = new Directory(documentDirectory, DIRNAME)
    if (!dir.exists) dir.create({ idempotent: true, intermediates: true })
    new File(dir, FILENAME).write(themePreferenceSnapshot)
  } catch (err) {
    console.warn('themePreferenceStorage: setSavedThemePreference failed', err)
  }
}
