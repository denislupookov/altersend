import React from 'react'
import ReactDOM from 'react-dom/client'
import { ThemeProvider, ThemeType } from '@altersend/components'
import { initI18n, resolveLocalePreference } from '@altersend/locales'
import App from './App'
import { getBrowserLocales, getSavedLocalePreference } from './localePreference'
import { registerStreamWorker, sweepOpfs } from './transfer/storage'
import './strict.css'
import './index.css'

async function bootstrap() {
  registerStreamWorker()
  sweepOpfs()

  try {
    await initI18n(resolveLocalePreference(getSavedLocalePreference(), getBrowserLocales()))
  } catch (error) {
    console.warn('Failed to bootstrap locale', error)
  }

  ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
      <ThemeProvider theme={ThemeType.Dark}>
        <App />
      </ThemeProvider>
    </React.StrictMode>
  )
}

bootstrap().catch((error) => console.error('Failed to start', error))
