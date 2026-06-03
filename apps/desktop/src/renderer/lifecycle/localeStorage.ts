const KEY = 'altersend.locale'

export function getSavedLocale(): string | null {
  try {
    return window.localStorage.getItem(KEY)
  } catch {
    return null
  }
}

export function setSavedLocale(locale: string): void {
  try {
    window.localStorage.setItem(KEY, locale)
  } catch {}
}
