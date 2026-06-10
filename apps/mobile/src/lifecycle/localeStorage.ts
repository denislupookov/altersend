import { Directory, File, Paths } from 'expo-file-system'
import type { LocalePreference } from '@altersend/locales'

const DIRNAME = 'altersend'
const FILENAME = 'locale.txt'

function getLocaleFile(): File | null {
  const documentDirectory = Paths.document
  if (!documentDirectory?.uri) return null
  return new File(new Directory(documentDirectory, DIRNAME), FILENAME)
}

export async function getSavedLocale(): Promise<LocalePreference | null> {
  try {
    const file = getLocaleFile()
    if (!file?.exists) return null
    const content = await file.text()
    return (content.trim() || null) as LocalePreference | null
  } catch {
    return null
  }
}

export async function setSavedLocale(locale: LocalePreference): Promise<void> {
  try {
    const documentDirectory = Paths.document
    if (!documentDirectory?.uri) return
    const dir = new Directory(documentDirectory, DIRNAME)
    if (!dir.exists) dir.create({ idempotent: true, intermediates: true })
    const file = new File(dir, FILENAME)
    file.write(locale)
  } catch (err) {
    console.warn('localeStorage: setSavedLocale failed', err)
  }
}
