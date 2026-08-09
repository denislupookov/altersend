import { accountApiUrl, createAccountRuntime, type AccountStorage } from '@altersend/domain'
import { bridgeApi } from '../api/bridgeApi'
import { isRelayEnabled } from './relayStorage'

const accountStorage: AccountStorage = {
  read: () => bridgeApi.getAccountCode(),
  write: (code) => bridgeApi.setAccountCode(code),
  clear: () => bridgeApi.clearAccountCode()
}

const runtime = createAccountRuntime({
  baseUrl: (import.meta.env.VITE_PRO_API_URL as string | undefined) || accountApiUrl,
  storage: accountStorage,
  openUrl: (url) => bridgeApi.openExternalUrl(url),
  applyToken: async (proToken) => {
    await bridgeApi.worker.setRelayConfig({ enabled: isRelayEnabled(), proToken })
  }
})

export const accountAdapter = runtime.adapter
export const syncAccountToken = runtime.syncToken
export const startAccountSync = runtime.startSync
export const stopAccountSync = runtime.stopSync
