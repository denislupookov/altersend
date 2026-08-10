import { accountApiUrl, createAccountRuntime, type AccountStorage } from '@altersend/domain'
import { bridgeApi } from '../api/bridgeApi'
import { isRelayEnabled } from './relayStorage'

const accountStorage: AccountStorage = {
  read: () => bridgeApi.getAccountCode(),
  write: (code) => bridgeApi.setAccountCode(code),
  clear: () => bridgeApi.clearAccountCode(),
  readToken: () => bridgeApi.getAccountToken(),
  writeToken: (token) => bridgeApi.setAccountToken(token)
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
const warnSync = (err: unknown) => console.warn('[account] focus sync failed', err)

export function startAccountSync(): void {
  runtime.startSync()
  window.addEventListener('focus', () => {
    runtime.syncTokenIfStale().catch(warnSync)
  })
}
