import React from 'react'
import ReactDOM from 'react-dom/client'
import { CrashScreen, ErrorBoundary, ThemeProvider, ThemeType } from '@altersend/components'
import { initI18n, resolveLocalePreference } from '@altersend/i18n'
import {
  bindTransferApi,
  startBackgroundReconnectEffect,
  startPeerWatchdog
} from '@altersend/domain'
import App from './App.js'
import { bridgeApi, hasBridge } from './api/bridgeApi'
import { startDeepLinkHandler } from './lifecycle/deepLinkHandler'
import { initSentry, captureException } from './sentry'
import { isCrashReportingEnabled } from './lifecycle/crashReportingStorage'
import { getSavedLocalePreference } from './lifecycle/localePreferenceStorage'
import { getDesktopSystemLocales } from './lifecycle/systemLocale'
import './strict.css'
import './index.css'

initSentry()
void bridgeApi.setSentryEnabled(isCrashReportingEnabled())

if (hasBridge()) {
  bindTransferApi(bridgeApi, {
    onError: (context, error) => captureException(error, context)
  })
  startPeerWatchdog()
  startBackgroundReconnectEffect()
  startDeepLinkHandler()
}

async function bootstrap() {
  await initI18n(resolveLocalePreference(getSavedLocalePreference(), getDesktopSystemLocales()))

  ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
      <ThemeProvider theme={ThemeType.Dark}>
        <ErrorBoundary
          fallback={(error) => {
            captureException(error)
            return (
              <CrashScreen
                error={error}
                onRestart={() => bridgeApi.appRestart?.()}
                description='AlterSend hit an unexpected error and needs to restart. The transfer worker may be in an inconsistent state, so a restart is the safest option.'
                restartLabel='Restart AlterSend'
              />
            )
          }}
        >
          <App />
        </ErrorBoundary>
      </ThemeProvider>
    </React.StrictMode>
  )
}

void bootstrap()
