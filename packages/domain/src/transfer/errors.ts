import { TRANSFER_ERROR_CODES, type TransferErrorCode } from './types'

const TRANSFER_ERROR_CODE_SET = new Set<string>(Object.values(TRANSFER_ERROR_CODES))

export function getTransferDebugMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error)
}

export function isTransferErrorCode(value: unknown): value is TransferErrorCode {
  return typeof value === 'string' && TRANSFER_ERROR_CODE_SET.has(value)
}

export function getTransferErrorCode(
  error: unknown,
  fallback: TransferErrorCode = TRANSFER_ERROR_CODES.transferFailed
): TransferErrorCode {
  if (
    error &&
    typeof error === 'object' &&
    'code' in error &&
    isTransferErrorCode((error as { code?: unknown }).code)
  ) {
    return (error as { code: TransferErrorCode }).code
  }

  const message = getTransferDebugMessage(error)
  if (/invalid topic format/i.test(message)) return TRANSFER_ERROR_CODES.invalidTopic

  return fallback
}
