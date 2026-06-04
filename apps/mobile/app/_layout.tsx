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
import { Stack } from 'expo-router'
import { StyleSheet, View } from 'react-native'
import { LoadingScreen } from '../src/loading'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { mobileApi } from '../src/api/mobileApi'
import { ToastProvider } from '../src/components/Toast'
import { UpdateBanner } from '../src/components/UpdateBanner'
import { startAppStateBridge } from '../src/lifecycle/appStateBridge'
import { startDeepLinkHandler } from '../src/lifecycle/deepLinkHandler'
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

function getFlowScreenOptions(theme: Theme) {
  return {
    headerShown: true,
    headerStyle: { backgroundColor: theme.colors.colorBackground },
    headerTintColor: theme.colors.colorTextPrimary,
    headerShadowVisible: false,
    headerTitle: '',
    headerBackTitle: 'Back'
  } as const
}

function ThemedStack() {
  const { theme } = useTheme()
  const flowScreenOptions = getFlowScreenOptions(theme)
  const progress = useSimulatedLoading()

  if (progress < 100) {
    return <LoadingScreen progress={progress} />
  }

  return (
    <Stack>
      <Stack.Screen name='(tabs)' options={{ headerShown: false }} />
      <Stack.Screen name='onboarding' options={{ headerShown: false, gestureEnabled: false }} />
      <Stack.Screen name='settings' options={flowScreenOptions} />
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
  return (
    <SafeAreaProvider>
      <View style={styles.root}>
        <ThemeProvider theme={ThemeType.Dark}>
          <ErrorBoundary
            fallback={(error, reset) => {
              captureException(error)
              return (
                <CrashScreen
                  error={error}
                  onRestart={reset}
                  description='AlterSend hit an unexpected error. Try again, or close and reopen the app if the problem persists.'
                  restartLabel='Try again'
                />
              )
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
