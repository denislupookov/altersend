import { create } from 'zustand'
import { getInitialLocale, isRTL } from '@altersend/locales'

export interface SettingsState {
  /** Active production-ready locale code (e.g. `en`). */
  locale: string
  /** Whether the active locale is right-to-left. */
  isRTL: boolean
}

const initialLocale = getInitialLocale()

export const initialSettingsState: SettingsState = {
  locale: initialLocale,
  isRTL: isRTL(initialLocale)
}

// Module-scope store, mirroring the transfer store: user preferences live
// outside the React tree and outside transient transfer-session state.
export const settingsStore = create<SettingsState>()(() => initialSettingsState)

export const useSettingsStore = settingsStore
