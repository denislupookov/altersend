import { TRANSFER_ERROR_CODES, type TransferErrorCode } from './types'

const TRANSFER_ERROR_CODE_SET = new Set<string>(Object.values(TRANSFER_ERROR_CODES))

type Translate = (key: string, options?: Record<string, unknown>) => string

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

  if (
    error &&
    typeof error === 'object' &&
    'transferErrorCode' in error &&
    isTransferErrorCode((error as { transferErrorCode?: unknown }).transferErrorCode)
  ) {
    return (error as { transferErrorCode: TransferErrorCode }).transferErrorCode
  }

  return fallback
}

export function getDisplayError(
  t: Translate,
  code: TransferErrorCode | null,
  options: { invalidTopicKey?: string } = {}
) {
  if (!code) return null

  switch (code) {
    case TRANSFER_ERROR_CODES.invalidTopic:
      return t(options.invalidTopicKey ?? 'receive:errors.invalidCode')
    case TRANSFER_ERROR_CODES.joinFailed:
      return t('errors:transfer.joinFailed')
    case TRANSFER_ERROR_CODES.peerUnreachable:
      return t('errors:transfer.peerUnreachable')
    case TRANSFER_ERROR_CODES.downloadFailed:
      return t('errors:transfer.downloadFailed')
    case TRANSFER_ERROR_CODES.transferFailed:
      return t('errors:transfer.transferFailed')
    default: {
      const exhaustiveCheck: never = code
      return exhaustiveCheck
    }
  }
}
