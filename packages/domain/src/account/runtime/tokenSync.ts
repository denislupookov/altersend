import type { AccountClient } from '../transport'
import { setSubscriptionActive } from './store'

const REFRESH_MS = 12 * 60 * 60 * 1000

export interface TokenSyncOptions {
  client: AccountClient
  readCode(): Promise<string | null>
  applyToken(token: string | null): Promise<void>
}

export interface TokenSync {
  sync(): Promise<boolean>
  start(): void
  stop(): void
}

export function createTokenSync({ client, readCode, applyToken }: TokenSyncOptions): TokenSync {
  let token: string | null = null
  let timer: ReturnType<typeof setInterval> | null = null

  const report = (err: unknown) =>
    console.warn('[account] token sync failed:', err instanceof Error ? err.message : String(err))

  async function push(): Promise<void> {
    setSubscriptionActive(token !== null)
    await applyToken(token)
  }

  async function sync(): Promise<boolean> {
    const code = await readCode()

    if (!code) {
      token = null
      await push()
      return false
    }

    try {
      const result = await client.token(code)
      token = result?.token ?? null
    } catch (err) {
      report(err)
      return token !== null
    }

    await push()
    return token !== null
  }

  return {
    sync,
    start() {
      if (timer) return
      sync().catch(report)
      timer = setInterval(() => {
        sync().catch(report)
      }, REFRESH_MS)
    },
    stop() {
      if (!timer) return
      clearInterval(timer)
      timer = null
    }
  }
}
