import React from 'react'
import ReactDOM from 'react-dom/client'
import {
  CrashScreen,
  ErrorBoundary,
  ThemeProvider,
  applyDocumentTheme,
  getSystemTheme,
  resolveThemePreference,
  type ThemePreference
} from '@altersend/components'
import {
  getLocaleFontFamily,
  initI18n,
  isSupportedLocaleCode,
  resolveLocalePreference,
  useTranslation
} from '@altersend/locales'
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
import { isRelayEnabled } from './lifecycle/relayStorage'
import { startAccountSync } from './lifecycle/account'
import { getSavedLocalePreference } from './lifecycle/localePreferenceStorage'
import { getSavedThemePreference, setSavedThemePreference } from './lifecycle/themeStorage'
import { getDesktopSystemLocales } from './lifecycle/systemLocale'
import './strict.css'
import './fonts.css'
import './index.css'

function DesktopCrashScreen({ error }: { error: Error }) {
  const { t } = useTranslation(['errors'])

  return (
    <CrashScreen
      error={error}
      onRestart={() => bridgeApi.appRestart?.()}
      title={t('errors:crash.title')}
      description={t('errors:crash.desktopDescription')}
      restartLabel={t('errors:crash.restartAlterSend')}
    />
  )
}

const savedThemePreference = getSavedThemePreference()

function handleThemePreferenceChange(preference: ThemePreference) {
  setSavedThemePreference(preference)
  if (!hasBridge()) return
  bridgeApi
    .setThemePreference(preference)
    .catch((error) => captureException(error, 'setThemePreference'))
}

function DesktopRoot() {
  const { i18n } = useTranslation()
  const language = i18n.resolvedLanguage ?? i18n.language
  const locale = isSupportedLocaleCode(language) ? language : 'en-US'
  const fontFamily = getLocaleFontFamily(locale)

  return (
    <ThemeProvider
      preference={savedThemePreference}
      onPreferenceChange={handleThemePreferenceChange}
      fontFamily={fontFamily}
    >
      <ErrorBoundary
        fallback={(error) => {
          captureException(error)
          return <DesktopCrashScreen error={error} />
        }}
      >
        <App />
      </ErrorBoundary>
    </ThemeProvider>
  )
}

applyDocumentTheme(resolveThemePreference(savedThemePreference, getSystemTheme()))

initSentry()
void bridgeApi.setSentryEnabled(isCrashReportingEnabled())

if (hasBridge()) {
  bindTransferApi(bridgeApi, {
    onError: (context, error) => captureException(error, context)
  })
  bridgeApi.worker
    .setRelayConfig({ enabled: isRelayEnabled() })
    .catch((err) => captureException(err, 'setRelayConfig'))
  startAccountSync()
  startPeerWatchdog()
  startBackgroundReconnectEffect()
  startDeepLinkHandler()
}

async function bootstrap() {
  try {
    await initI18n(resolveLocalePreference(getSavedLocalePreference(), getDesktopSystemLocales()))
  } catch (error) {
    captureException(error)
    console.warn('Failed to bootstrap locale', error)
  }

  ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
      <DesktopRoot />
    </React.StrictMode>
  )
}

void bootstrap()
