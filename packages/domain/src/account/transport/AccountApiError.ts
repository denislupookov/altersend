export const NETWORK_ERROR_STATUS = 0
export const TIMEOUT_ERROR_STATUS = -1
export const SERVER_ERROR_STATUS = 500

export class AccountApiError extends Error {
  readonly status: number

  constructor(status: number, message: string, cause?: unknown) {
    super(message, { cause })
    this.name = 'AccountApiError'
    this.status = status
  }
}
