import {
  SYSTEM_LOCALE_PREFERENCE,
  normalizeLocalePreference,
  type LocalePreference
} from '@altersend/i18n'
import { Directory, File, Paths } from 'expo-file-system'

const DIRNAME = 'altersend'
const FILENAME = 'locale.preference'

function getPreferenceFile(): File | null {
  const documentDirectory = Paths.document
  if (!documentDirectory?.uri) return null
  return new File(new Directory(documentDirectory, DIRNAME), FILENAME)
}

export async function getSavedLocalePreference(): Promise<LocalePreference> {
  try {
    const file = getPreferenceFile()
    if (!file?.exists) return SYSTEM_LOCALE_PREFERENCE
    return normalizeLocalePreference(await file.text())
  } catch {
    return SYSTEM_LOCALE_PREFERENCE
  }
}

export async function setSavedLocalePreference(preference: LocalePreference): Promise<void> {
  try {
    const documentDirectory = Paths.document
    if (!documentDirectory?.uri) return
    const dir = new Directory(documentDirectory, DIRNAME)
    if (!dir.exists) dir.create({ idempotent: true, intermediates: true })
    new File(dir, FILENAME).write(preference)
  } catch (err) {
    console.warn('localePreferenceStorage: setSavedLocalePreference failed', err)
  }
}
