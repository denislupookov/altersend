import {
  CrashScreen,
  ErrorBoundary,
  ThemeProvider,
  ThemeType,
  useTheme
} from '@altersend/components'
import type { Theme } from '@altersend/components'
import {
  bindTransferApi,
  startBackgroundReconnectEffect,
  startPeerWatchdog,
  useSimulatedLoading
} from '@altersend/domain'
import { initI18n, resolveLocalePreference, useTranslation } from '@altersend/i18n'
import { Stack } from 'expo-router'
import { StyleSheet, View } from 'react-native'
import { useEffect, useState } from 'react'
import { LoadingScreen } from '../src/loading'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { mobileApi } from '../src/api/mobileApi'
import { ToastProvider } from '../src/components/Toast'
import { UpdateBanner } from '../src/components/UpdateBanner'
import { startAppStateBridge } from '../src/lifecycle/appStateBridge'
import { startDeepLinkHandler } from '../src/lifecycle/deepLinkHandler'
import { getSavedLocalePreference } from '../src/lifecycle/localePreferenceStorage'
import { getMobileSystemLocales } from '../src/lifecycle/systemLocale'
import { ShareIntentHandler } from '../src/lifecycle/ShareIntentHandler'
import { startPhotosCopyEffect } from '../src/transfer/receive'
import { initSentry, captureException } from '../src/sentry'

initSentry()
bindTransferApi(mobileApi, {
  onError: (context, error) => captureException(error, context)
})
startAppStateBridge()
startPeerWatchdog()
startBackgroundReconnectEffect()
startPhotosCopyEffect()
startDeepLinkHandler()

function MobileCrashScreen({ error, onRestart }: { error: Error; onRestart: () => void }) {
  const { t } = useTranslation(['errors'])

  return (
    <CrashScreen
      error={error}
      onRestart={onRestart}
      title={t('errors:crash.title')}
      description={t('errors:crash.mobileDescription')}
      restartLabel={t('errors:crash.tryAgain')}
    />
  )
}

function getFlowScreenOptions(theme: Theme, backTitle: string) {
  return {
    headerShown: true,
    headerStyle: { backgroundColor: theme.colors.colorBackground },
    headerTintColor: theme.colors.colorTextPrimary,
    headerShadowVisible: false,
    headerTitle: '',
    headerBackTitle: backTitle
  } as const
}

function ThemedStack() {
  const { t } = useTranslation(['common'])
  const { theme } = useTheme()
  const flowScreenOptions = getFlowScreenOptions(theme, t('common:actions.back'))
  const progress = useSimulatedLoading()

  if (progress < 100) {
    return <LoadingScreen progress={progress} />
  }

  return (
    <Stack>
      <Stack.Screen name='(tabs)' options={{ headerShown: false }} />
      <Stack.Screen name='onboarding' options={{ headerShown: false, gestureEnabled: false }} />
      <Stack.Screen name='settings' options={flowScreenOptions} />
      <Stack.Screen name='language' options={flowScreenOptions} />
      <Stack.Screen name='report' options={flowScreenOptions} />
      <Stack.Screen
        name='send/preparing'
        options={{ ...flowScreenOptions, gestureEnabled: false }}
      />
      <Stack.Screen name='send/share' options={{ ...flowScreenOptions, gestureEnabled: false }} />
      <Stack.Screen name='receive/scan' options={flowScreenOptions} />
      <Stack.Screen
        name='receive/incoming'
        options={{ ...flowScreenOptions, gestureEnabled: false }}
      />
      <Stack.Screen
        name='receive/complete'
        options={{
          headerShown: false,
          gestureEnabled: false
        }}
      />
    </Stack>
  )
}

export default function RootLayout() {
  const [i18nReady, setI18nReady] = useState(false)

  useEffect(() => {
    let mounted = true
    async function initializeLocale() {
      const preference = await getSavedLocalePreference()
      await initI18n(resolveLocalePreference(preference, getMobileSystemLocales()))
      if (mounted) setI18nReady(true)
    }

    void initializeLocale()
    return () => {
      mounted = false
    }
  }, [])

  if (!i18nReady) return null

  return (
    <SafeAreaProvider>
      <View style={styles.root}>
        <ThemeProvider theme={ThemeType.Dark}>
          <ErrorBoundary
            fallback={(error, reset) => {
              captureException(error)
              return <MobileCrashScreen error={error} onRestart={reset} />
            }}
          >
            <ToastProvider>
              <ShareIntentHandler />
              <ThemedStack />
              <UpdateBanner />
            </ToastProvider>
          </ErrorBoundary>
        </ThemeProvider>
      </View>
    </SafeAreaProvider>
  )
}

const styles = StyleSheet.create({
  root: {
    flex: 1
  }
})
