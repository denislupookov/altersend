import type { AccountClient } from '../transport'
import { setSubscriptionActive } from './store'

const REFRESH_MS = 12 * 60 * 60 * 1000
const STALE_AFTER_MS = 5 * 60 * 1000

export interface TokenSyncOptions {
  client: AccountClient
  readCode(): Promise<string | null>
  applyToken(token: string | null): Promise<void>
  readCachedToken?(): Promise<string | null>
  cacheToken?(token: string | null): Promise<void>
}

export interface TokenSync {
  sync(): Promise<boolean>
  syncIfStale(minAgeMs?: number): Promise<boolean>
  start(): void
  stop(): void
}

function proTokenExpiry(token: string): number | null {
  try {
    const [body] = token.split('.')
    if (!body) return null

    const json = atob(body.replace(/-/g, '+').replace(/_/g, '/'))
    const expiry = (JSON.parse(json) as { e?: unknown }).e

    return typeof expiry === 'number' ? expiry * 1000 : null
  } catch {
    return null
  }
}

export function createTokenSync({
  client,
  readCode,
  applyToken,
  readCachedToken,
  cacheToken
}: TokenSyncOptions): TokenSync {
  let token: string | null = null
  let timer: ReturnType<typeof setInterval> | null = null
  let lastSyncAt = 0
  let running: Promise<boolean> | null = null
  let generation = 0

  const report = (err: unknown) =>
    console.warn('[account] token sync failed:', err instanceof Error ? err.message : String(err))

  async function push(): Promise<void> {
    setSubscriptionActive(token !== null)
    await applyToken(token)
    await cacheToken?.(token)
  }

  async function seed(): Promise<void> {
    if (!readCachedToken) return

    const cached = await readCachedToken().catch(report)
    if (!cached || token) return

    const expiresAt = proTokenExpiry(cached)
    if (expiresAt === null || expiresAt <= Date.now()) return

    token = cached
    setSubscriptionActive(true)
    await applyToken(token)
  }

  async function run(): Promise<boolean> {
    const attempt = ++generation
    const code = await readCode()

    if (!code) {
      if (attempt !== generation) return token !== null
      token = null
      await push()
      return false
    }

    let fresh: string | null
    try {
      const result = await client.token(code)
      fresh = result?.token ?? null
    } catch (err) {
      report(err)
      return token !== null
    }

    if (attempt !== generation) return token !== null

    token = fresh
    lastSyncAt = Date.now()
    await push()

    return token !== null
  }

  function sync(): Promise<boolean> {
    if (running) return running
    running = run().finally(() => {
      running = null
    })
    return running
  }

  async function syncIfStale(minAgeMs = STALE_AFTER_MS): Promise<boolean> {
    if (Date.now() - lastSyncAt < minAgeMs) return token !== null
    return sync()
  }

  return {
    sync,
    syncIfStale,
    start() {
      if (timer) return
      seed()
        .catch(report)
        .then(() => sync())
        .catch(report)
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
