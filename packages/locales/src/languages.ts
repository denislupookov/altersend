import enMeta from './locales/en-US/meta.json'
import ptBrMeta from './locales/pt-BR/meta.json'

export type TextDirection = 'ltr' | 'rtl'

export interface LanguageMeta {
  /** Native display name shown in the language picker. */
  label: string
  /**
   * Whether the language is complete enough to be offered to users. Only
   * production-ready languages appear in the picker; everything else (partial
   * translations, untested RTL layouts, …) stays hidden until promoted.
   */
  productionReady: boolean
  /** Writing direction. RTL languages stay hidden until layout support lands. */
  dir: TextDirection
}

export interface Language extends LanguageMeta {
  code: string
}

/**
 * Registry of every known language, keyed by BCP-47 code, including ones that
 * are not yet production-ready. Each entry's metadata lives next to its
 * translations in `locales/<code>/meta.json` so adding a language is a single
 * self-contained folder.
 */
const REGISTRY = {
  'en-US': enMeta,
  'pt-BR': ptBrMeta
}

export type SupportedLanguageCode = keyof typeof REGISTRY

export type LocalePreference = 'system' | SupportedLanguageCode

export const DEFAULT_LANGUAGE = 'en-US'

/**
 * Release gate for the language-picker UI. While `false`, the in-app language
 * selection is hidden (desktop Settings + mobile Settings) so the app stays
 * single-language until translations ship; the i18n infrastructure stays wired
 * underneath. Flip to `true` to expose the picker.
 */
export const MULTI_LANG_ENABLED = false

// `dir` widens to `string` when imported from JSON, so it is narrowed here.
function toLanguage(
  code: string,
  meta: { label: string; productionReady: boolean; dir: string }
): Language {
  return {
    code,
    label: meta.label,
    productionReady: meta.productionReady,
    dir: meta.dir === 'rtl' ? 'rtl' : 'ltr'
  }
}

/** All registered languages (ready or not). */
export const LANGUAGES: Language[] = Object.entries(REGISTRY).map(([code, meta]) =>
  toLanguage(code, meta)
)

/** Languages offered in the picker — production-ready only. */
export const PICKABLE_LANGUAGES: Language[] = LANGUAGES.filter((l) => l.productionReady)

export function getLanguage(code: string): Language | undefined {
  return LANGUAGES.find((l) => l.code === code)
}

/** Whether `code` is registered and production-ready (i.e. user-selectable). */
export function isPickable(code: string): boolean {
  return PICKABLE_LANGUAGES.some((l) => l.code === code)
}

/** Right-to-left check driven by the registry (single source of truth). */
export function isRTL(code: string): boolean {
  return getLanguage(code)?.dir === 'rtl'
}
