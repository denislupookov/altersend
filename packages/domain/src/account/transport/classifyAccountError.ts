import type { AccountError } from '../core'
import { AccountApiError, NETWORK_ERROR_STATUS, TIMEOUT_ERROR_STATUS } from './AccountApiError'

export function classifyAccountError(err: unknown): AccountError {
  if (!(err instanceof AccountApiError)) return 'failed'
  if (err.status === NETWORK_ERROR_STATUS) return 'offline'
  if (err.status === TIMEOUT_ERROR_STATUS || err.status >= 500) return 'server'
  return 'failed'
}
