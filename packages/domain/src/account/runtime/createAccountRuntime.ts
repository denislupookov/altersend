import type { AccountStorage, PurchaseAdapter } from '../ports'
import { createAccountClient } from '../transport'
import { createTokenSync } from './tokenSync'
import type { AccountAdapter } from './useAccount'

export interface AccountRuntimeOptions {
  baseUrl: string
  storage: AccountStorage
  openUrl(url: string): Promise<void>
  applyToken(token: string | null): Promise<void>
  purchases?: PurchaseAdapter
}

export interface AccountRuntime {
  adapter: AccountAdapter
  syncToken(): Promise<boolean>
  syncTokenIfStale(): Promise<boolean>
  startSync(): void
  stopSync(): void
}

export function createAccountRuntime({
  baseUrl,
  storage,
  openUrl,
  applyToken,
  purchases
}: AccountRuntimeOptions): AccountRuntime {
  const client = createAccountClient(baseUrl)
  const tokenSync = createTokenSync({
    client,
    readCode: storage.read,
    applyToken,
    readCachedToken: storage.readToken?.bind(storage),
    cacheToken: storage.writeToken?.bind(storage)
  })

  return {
    adapter: {
      client,
      storage,
      openUrl,
      syncToken: tokenSync.sync,
      purchases
    },
    syncToken: tokenSync.sync,
    syncTokenIfStale: tokenSync.syncIfStale,
    startSync: tokenSync.start,
    stopSync: tokenSync.stop
  }
}
