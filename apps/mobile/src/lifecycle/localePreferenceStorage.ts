import {
  SYSTEM_LOCALE_PREFERENCE,
  normalizeLocalePreference,
  type LocalePreference
} from '@altersend/locales'
import { Directory, File, Paths } from 'expo-file-system'

const DIRNAME = 'altersend'
const FILENAME = 'locale.preference'
const listeners = new Set<(preference: LocalePreference) => void>()
let localePreferenceSnapshot: LocalePreference = SYSTEM_LOCALE_PREFERENCE

function setLocalePreferenceSnapshot(preference: LocalePreference) {
  localePreferenceSnapshot = preference
  listeners.forEach((listener) => listener(preference))
}

export function getLocalePreferenceSnapshot(): LocalePreference {
  return localePreferenceSnapshot
}

export function subscribeLocalePreference(
  listener: (preference: LocalePreference) => void
): () => void {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

function getPreferenceFile(): File | null {
  const documentDirectory = Paths.document
  if (!documentDirectory?.uri) return null
  return new File(new Directory(documentDirectory, DIRNAME), FILENAME)
}

export async function getSavedLocalePreference(): Promise<LocalePreference> {
  try {
    const file = getPreferenceFile()
    const preference = file?.exists
      ? normalizeLocalePreference(await file.text())
      : SYSTEM_LOCALE_PREFERENCE
    setLocalePreferenceSnapshot(preference)
    return preference
  } catch {
    setLocalePreferenceSnapshot(SYSTEM_LOCALE_PREFERENCE)
    return SYSTEM_LOCALE_PREFERENCE
  }
}

export async function setSavedLocalePreference(preference: LocalePreference): Promise<void> {
  const normalizedPreference = normalizeLocalePreference(preference)
  setLocalePreferenceSnapshot(normalizedPreference)

  try {
    const documentDirectory = Paths.document
    if (!documentDirectory?.uri) return
    const dir = new Directory(documentDirectory, DIRNAME)
    if (!dir.exists) dir.create({ idempotent: true, intermediates: true })
    new File(dir, FILENAME).write(normalizedPreference)
  } catch (err) {
    console.warn('localePreferenceStorage: setSavedLocalePreference failed', err)
  }
}
