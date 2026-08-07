import React from 'react'
import ReactDOM from 'react-dom/client'
import {
  ThemeProvider,
  applyDocumentTheme,
  getSystemTheme,
  resolveThemePreference
} from '@altersend/components'
import { initI18n, resolveLocalePreference } from '@altersend/locales'
import App from './App'
import { getBrowserLocales, getSavedLocalePreference } from './localePreference'
import { getSavedThemePreference, setSavedThemePreference } from './themePreference'
import { registerStreamWorker, sweepOpfs } from './transfer/storage'
import './strict.css'
import './index.css'

async function bootstrap() {
  const themePreference = getSavedThemePreference()
  applyDocumentTheme(resolveThemePreference(themePreference, getSystemTheme()))
  registerStreamWorker()
  sweepOpfs()

  try {
    await initI18n(resolveLocalePreference(getSavedLocalePreference(), getBrowserLocales()))
  } catch (error) {
    console.warn('Failed to bootstrap locale', error)
  }

  ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
      <ThemeProvider preference={themePreference} onPreferenceChange={setSavedThemePreference}>
        <App />
      </ThemeProvider>
    </React.StrictMode>
  )
}

bootstrap().catch((error) => console.error('Failed to start', error))
