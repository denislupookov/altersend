import type { BillingPlan } from '../core'
import {
  AccountApiError,
  NETWORK_ERROR_STATUS,
  SERVER_ERROR_STATUS,
  TIMEOUT_ERROR_STATUS
} from './AccountApiError'

const REQUEST_TIMEOUT_MS = 15000

interface NewAccount {
  code: string
  validUntil: string
  active: boolean
}

type PaymentProvider = 'stripe' | 'revenuecat'

export interface AccountStatus {
  exists: boolean
  active: boolean
  validUntil?: string
  provider?: PaymentProvider | null
}

interface AccountToken {
  token: string
  expiresAt: number
}

interface SubscriptionState {
  provider: PaymentProvider | null
  cancelling: boolean
  endsAt: string | null
}

interface AccountDeletion {
  deleted: boolean
  subscriptionCancelled: boolean
  customerDeleted: boolean
}

interface PlanPriceResponse {
  plan: BillingPlan
  formatted: string
}

export interface AccountClient {
  prices(): Promise<PlanPriceResponse[]>
  create(): Promise<NewAccount>
  status(code: string): Promise<AccountStatus>
  syncStore(code: string): Promise<AccountStatus>
  checkout(code: string, plan: BillingPlan): Promise<string>
  portal(code: string): Promise<string>
  subscription(code: string): Promise<SubscriptionState>
  cancel(code: string): Promise<void>
  remove(code: string): Promise<AccountDeletion>
  token(code: string): Promise<AccountToken | null>
}

async function send<T>(
  baseUrl: string,
  path: string,
  method: 'GET' | 'POST' | 'DELETE',
  body?: unknown
): Promise<T> {
  const controller = new AbortController()
  const expiry = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)
  let response: Response

  try {
    response = await fetch(`${baseUrl}${path}`, {
      method,
      headers: { 'content-type': 'application/json' },
      body: method === 'GET' ? undefined : JSON.stringify(body ?? {}),
      signal: controller.signal
    })
  } catch (err) {
    clearTimeout(expiry)
    const status = controller.signal.aborted ? TIMEOUT_ERROR_STATUS : NETWORK_ERROR_STATUS
    throw new AccountApiError(status, `${path} could not be reached`, err)
  }

  try {
    if (!response.ok) {
      throw new AccountApiError(response.status, `${path} failed with ${response.status}`)
    }

    return (await response.json()) as T
  } catch (err) {
    if (err instanceof AccountApiError) throw err

    const status = controller.signal.aborted ? TIMEOUT_ERROR_STATUS : SERVER_ERROR_STATUS
    throw new AccountApiError(status, `${path} returned an unreadable body`, err)
  } finally {
    clearTimeout(expiry)
  }
}

export function createAccountClient(baseUrl: string): AccountClient {
  const post = <T>(path: string, body?: unknown) => send<T>(baseUrl, path, 'POST', body)

  return {
    async prices() {
      const { prices } = await send<{ prices: PlanPriceResponse[] }>(
        baseUrl,
        '/api/pro/prices',
        'GET'
      )
      return prices
    },

    create: () => post<NewAccount>('/api/pro/account'),

    async status(code) {
      try {
        return await post<AccountStatus>('/api/pro/status', { code })
      } catch (err) {
        if (err instanceof AccountApiError && err.status === 404) {
          return { exists: false, active: false }
        }
        throw err
      }
    },

    async syncStore(code) {
      const result = await post<{ active: boolean; validUntil?: string }>('/api/revenuecat/sync', {
        code
      })
      return { exists: true, active: result.active, validUntil: result.validUntil }
    },

    async checkout(code, plan) {
      const { url } = await post<{ url: string }>('/api/pro/checkout', { code, plan })
      return url
    },

    async portal(code) {
      const { url } = await post<{ url: string }>('/api/pro/portal', { code })
      return url
    },

    subscription: (code) => post<SubscriptionState>('/api/pro/subscription', { code }),

    async cancel(code) {
      await post<{ cancelled: boolean }>('/api/pro/cancel', { code })
    },

    remove: (code) => send<AccountDeletion>(baseUrl, '/api/pro/account', 'DELETE', { code }),

    async token(code) {
      try {
        return await post<AccountToken>('/api/pro/token', { code })
      } catch (err) {
        if (err instanceof AccountApiError && (err.status === 403 || err.status === 404))
          return null
        throw err
      }
    }
  }
}
