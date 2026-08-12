import {
  CrashScreen,
  ErrorBoundary,
  ThemeProvider,
  ThemeType,
  useTheme
} from '@altersend/components'
import type { Theme, ThemePreference } from '@altersend/components'
import {
  bindTransferApi,
  startBackgroundReconnectEffect,
  startDownloadRetryEffect,
  startPeerWatchdog,
  useSimulatedLoading,
  useSubscriptionStore
} from '@altersend/domain'
import {
  getLocaleFontFamily,
  initI18n,
  isSupportedLocaleCode,
  resolveLocalePreference,
  useTranslation
} from '@altersend/locales'
import { Stack } from 'expo-router'
import { Platform, StyleSheet, View } from 'react-native'
import { useEffect, useState } from 'react'
import * as SplashScreen from 'expo-splash-screen'
import * as SystemUI from 'expo-system-ui'
import { LoadingScreen } from '../src/loading'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { mobileApi } from '../src/api/mobileApi'
import { ToastProvider } from '../src/components/Toast'
import { AccountProvider } from '../src/account'
import { UpdateBanner } from '../src/components/UpdateBanner'
import { PairRequestBanner } from '../src/components/PairRequestBanner'
import { InviteBanner } from '../src/components/InviteBanner'
import { useAlterSendFonts } from '../src/theme/useAlterSendFonts'
import { startAppStateBridge } from '../src/lifecycle/appStateBridge'
import { startBackgroundTransferService } from '../src/lifecycle/backgroundTransferService'
import { startDeepLinkHandler } from '../src/lifecycle/deepLinkHandler'
import { DeepLinkGate } from '../src/lifecycle/DeepLinkGate'
import { getSavedLocalePreference } from '../src/lifecycle/localePreferenceStorage'
import {
  getSavedThemePreference,
  getThemePreferenceSnapshot,
  setSavedThemePreference
} from '../src/lifecycle/themePreferenceStorage'
import { isRelayEnabled } from '../src/lifecycle/relayStorage'
import { startAccountSync, syncAccountToken } from '../src/lifecycle/account'
import { watchEntitlement } from '../src/lifecycle/purchases'
import { UpgradeButton } from '@/src/components'
import { getMobileSystemLocales } from '../src/lifecycle/systemLocale'
import { ShareIntentHandler } from '../src/lifecycle/ShareIntentHandler'
import { startDownloadRoutingEffect } from '../src/transfer/receive'
import { initSentry, captureException } from '../src/sentry'

SplashScreen.preventAutoHideAsync().catch(() => {})

initSentry()
bindTransferApi(mobileApi, {
  onError: (context, error) => captureException(error, context)
})
mobileApi.worker
  .setRelayConfig({ enabled: isRelayEnabled() })
  .catch((err) => captureException(err, 'setRelayConfig'))
watchEntitlement(() => {
  syncAccountToken().catch((err) => console.warn('[account] entitlement sync failed', err))
})
startAccountSync()
startAppStateBridge()
startPeerWatchdog()
startBackgroundReconnectEffect()
startDownloadRetryEffect()
startBackgroundTransferService()
startDownloadRoutingEffect()
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

function getHeaderOptions(theme: Theme) {
  return {
    headerShown: true,
    headerStyle: { backgroundColor: theme.colors.colorBackground },
    headerTintColor: theme.colors.colorTextPrimary,
    headerShadowVisible: false,
    ...(Platform.OS === 'ios' ? { headerBackButtonDisplayMode: 'minimal' as const } : {})
  } as const
}

function getFlowScreenOptions(theme: Theme) {
  return {
    ...getHeaderOptions(theme),
    headerTitle: '',
    headerBackButtonMenuEnabled: false
  } as const
}

function getTitledScreenOptions(theme: Theme, fontFamilyName?: string) {
  return {
    ...getHeaderOptions(theme),
    ...(fontFamilyName ? { headerTitleStyle: { fontFamily: fontFamilyName } } : {})
  } as const
}

function persistThemePreference(preference: ThemePreference) {
  setSavedThemePreference(preference).catch((error) =>
    captureException(error, 'setSavedThemePreference')
  )
}

function ThemedStack() {
  const { theme, themeType, fontFamilyName } = useTheme()
  const { t } = useTranslation(['settings', 'feedback'])
  const flowScreenOptions = getFlowScreenOptions(theme)
  const titledScreenOptions = getTitledScreenOptions(theme, fontFamilyName)
  const progress = useSimulatedLoading()
  const statusBarStyle = themeType === ThemeType.Light ? 'dark' : 'light'
  const isPro = useSubscriptionStore((state) => state.active)

  useEffect(() => {
    SystemUI.setBackgroundColorAsync(theme.colors.colorBackground).catch((error) =>
      captureException(error, 'setSystemBackgroundColor')
    )
  }, [theme])

  return (
    <>
      <Stack
        screenOptions={{
          contentStyle: { backgroundColor: theme.colors.colorBackground },
          statusBarStyle
        }}
      >
        <Stack.Screen name='index' options={{ headerShown: false }} />
        <Stack.Screen name='(tabs)' options={{ headerShown: false }} />
        <Stack.Screen name='onboarding' options={{ headerShown: false, gestureEnabled: false }} />
        <Stack.Screen
          name='settings'
          options={{
            ...titledScreenOptions,
            title: t('settings:title'),
            headerRight: isPro ? undefined : () => <UpgradeButton />
          }}
        />
        <Stack.Screen
          name='language'
          options={{ ...titledScreenOptions, title: t('settings:languageTitle') }}
        />
        <Stack.Screen
          name='general'
          options={{ ...titledScreenOptions, title: t('settings:sections.general') }}
        />
        <Stack.Screen
          name='connection'
          options={{ ...titledScreenOptions, title: t('settings:rows.connection') }}
        />
        <Stack.Screen
          name='account'
          options={{
            headerShown: false,
            presentation: 'fullScreenModal',
            animation: 'slide_from_bottom'
          }}
        />
        <Stack.Screen
          name='subscription'
          options={{ ...titledScreenOptions, title: t('settings:account.title') }}
        />
        <Stack.Screen
          name='devices'
          options={{ ...titledScreenOptions, title: t('settings:pairing.pairedDevices') }}
        />
        <Stack.Screen
          name='about'
          options={{ ...titledScreenOptions, title: t('settings:sections.about') }}
        />
        <Stack.Screen
          name='report'
          options={{ ...titledScreenOptions, title: t('feedback:title') }}
        />
        <Stack.Screen name='send/preparing' options={flowScreenOptions} />
        <Stack.Screen name='send/share' options={flowScreenOptions} />
        <Stack.Screen name='receive/scan' options={flowScreenOptions} />
        <Stack.Screen name='receive/incoming' options={flowScreenOptions} />
        <Stack.Screen
          name='receive/complete'
          options={{
            headerShown: false,
            gestureEnabled: false
          }}
        />
      </Stack>
      {progress < 100 && (
        <View style={StyleSheet.absoluteFill}>
          <LoadingScreen progress={progress} />
        </View>
      )}
    </>
  )
}

function AppShell() {
  const { i18n } = useTranslation()
  const language = i18n.resolvedLanguage ?? i18n.language
  const locale = isSupportedLocaleCode(language) ? language : 'en-US'
  const fontFamily = getLocaleFontFamily(locale)

  return (
    <SafeAreaProvider>
      <View style={styles.root}>
        <ThemeProvider
          preference={getThemePreferenceSnapshot()}
          onPreferenceChange={persistThemePreference}
          fontFamily={fontFamily}
        >
          <ErrorBoundary
            fallback={(error, reset) => {
              captureException(error)
              return <MobileCrashScreen error={error} onRestart={reset} />
            }}
          >
            <ToastProvider>
              <AccountProvider>
                <ShareIntentHandler />
                <ThemedStack />
                <DeepLinkGate />
                <UpdateBanner />
                <PairRequestBanner />
                <InviteBanner />
              </AccountProvider>
            </ToastProvider>
          </ErrorBoundary>
        </ThemeProvider>
      </View>
    </SafeAreaProvider>
  )
}

export default function RootLayout() {
  const [preferencesReady, setPreferencesReady] = useState(false)
  const [fontsLoaded, fontError] = useAlterSendFonts()

  useEffect(() => {
    let mounted = true
    async function initializePreferences() {
      try {
        const [locale] = await Promise.all([getSavedLocalePreference(), getSavedThemePreference()])
        await initI18n(resolveLocalePreference(locale, getMobileSystemLocales()))
      } catch (error) {
        captureException(error)
        console.warn('Failed to initialize preferences:', error)
      } finally {
        if (mounted) setPreferencesReady(true)
      }
    }

    void initializePreferences()
    return () => {
      mounted = false
    }
  }, [])

  useEffect(() => {
    if (preferencesReady && fontsLoaded) {
      SplashScreen.hideAsync().catch(console.warn)
    }
  }, [fontsLoaded, preferencesReady])

  if (fontError) throw fontError
  if (!preferencesReady || !fontsLoaded) return null

  return <AppShell />
}

const styles = StyleSheet.create({
  root: {
    flex: 1
  }
})
