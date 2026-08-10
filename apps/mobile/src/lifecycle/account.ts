import { AppState, Linking } from 'react-native'
import * as SecureStore from 'expo-secure-store'
import { accountApiUrl, createAccountRuntime, type AccountStorage } from '@altersend/domain'
import { mobileApi } from '@/src/api/mobileApi'
import { purchaseAdapter, purchasesReady } from './purchases'
import { isRelayEnabled } from './relayStorage'

const CODE_KEY = 'altersend.account.code'
const TOKEN_KEY = 'altersend.account.token'

const accountStorage: AccountStorage = {
  async read() {
    try {
      return await SecureStore.getItemAsync(CODE_KEY)
    } catch (err) {
      console.warn('[account] could not read stored code', err)
      return null
    }
  },
  write: (code) => SecureStore.setItemAsync(CODE_KEY, code),
  clear: () => SecureStore.deleteItemAsync(CODE_KEY),
  async readToken() {
    try {
      return await SecureStore.getItemAsync(TOKEN_KEY)
    } catch (err) {
      console.warn('[account] could not read cached token', err)
      return null
    }
  },
  writeToken: (token) =>
    token ? SecureStore.setItemAsync(TOKEN_KEY, token) : SecureStore.deleteItemAsync(TOKEN_KEY)
}

const runtime = createAccountRuntime({
  baseUrl: process.env.EXPO_PUBLIC_PRO_API_URL || accountApiUrl,
  storage: accountStorage,
  openUrl: (url) => Linking.openURL(url),
  applyToken: async (proToken) => {
    await mobileApi.worker.setRelayConfig({ enabled: isRelayEnabled(), proToken })
  },
  purchases: purchasesReady ? purchaseAdapter : undefined
})

export const accountAdapter = runtime.adapter
export const syncAccountToken = runtime.syncToken
const warnSync = (err: unknown) => console.warn('[account] foreground sync failed', err)

export function startAccountSync(): void {
  runtime.startSync()
  AppState.addEventListener('change', (next) => {
    if (next === 'active') runtime.syncTokenIfStale().catch(warnSync)
  })
}
