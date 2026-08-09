import type { BillingPlan } from '../core'
import { AccountApiError, NETWORK_ERROR_STATUS, TIMEOUT_ERROR_STATUS } from './AccountApiError'

const REQUEST_TIMEOUT_MS = 15000

export interface NewAccount {
  code: string
  validUntil: string
  active: boolean
}

export interface AccountStatus {
  exists: boolean
  active: boolean
  validUntil?: string
}

export interface AccountToken {
  token: string
  expiresAt: number
}

export interface AccountDeletion {
  deleted: boolean
  subscriptionCancelled: boolean
  customerDeleted: boolean
}

export interface AccountClient {
  create(): Promise<NewAccount>
  status(code: string): Promise<AccountStatus>
  syncStore(code: string): Promise<AccountStatus>
  checkout(code: string, plan: BillingPlan): Promise<string>
  portal(code: string): Promise<string>
  remove(code: string): Promise<AccountDeletion>
  token(code: string): Promise<AccountToken | null>
}

async function send<T>(
  baseUrl: string,
  path: string,
  method: 'POST' | 'DELETE',
  body?: unknown
): Promise<T> {
  const controller = new AbortController()
  const expiry = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)
  let response: Response

  try {
    response = await fetch(`${baseUrl}${path}`, {
      method,
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body ?? {}),
      signal: controller.signal
    })
  } catch (err) {
    const status = controller.signal.aborted ? TIMEOUT_ERROR_STATUS : NETWORK_ERROR_STATUS
    throw new AccountApiError(status, `${path} could not be reached`, err)
  } finally {
    clearTimeout(expiry)
  }

  if (!response.ok) {
    throw new AccountApiError(response.status, `${path} failed with ${response.status}`)
  }

  return (await response.json()) as T
}

export function createAccountClient(baseUrl: string): AccountClient {
  const post = <T>(path: string, body?: unknown) => send<T>(baseUrl, path, 'POST', body)

  return {
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
