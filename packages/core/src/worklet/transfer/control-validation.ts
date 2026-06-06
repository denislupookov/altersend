import { isSafeFileName } from './utils'
import {
  PROTOCOL_VERSION,
  type DownloadComplete,
  type DownloadFailed,
  type DownloadProgress,
  type DownloadRequest,
  type FileOffer,
  type PeerControlMessage,
  type TransferReady,
  type TransferStart
} from './control-channel'

const MAX_ID_LEN = 128
const MAX_PATH_LEN = 4096
const MAX_MESSAGE_LEN = 1024
const MAX_FILES_PER_TRANSFER = 10_000

function isBoundedString(x: unknown, maxLen: number): x is string {
  return typeof x === 'string' && x.length > 0 && x.length <= maxLen
}

function isOptionalBoundedString(x: unknown, maxLen: number): boolean {
  return x === undefined || (typeof x === 'string' && x.length <= maxLen)
}

function isNonNegativeInteger(x: unknown, max = Number.MAX_SAFE_INTEGER): x is number {
  return typeof x === 'number' && Number.isInteger(x) && x >= 0 && x <= max
}

function isValidFileOffer(x: unknown): x is FileOffer {
  if (!x || typeof x !== 'object') return false
  const o = x as Partial<FileOffer>
  return (
    isBoundedString(o.id, MAX_ID_LEN) &&
    isBoundedString(o.transferId, MAX_ID_LEN) &&
    isSafeFileName(o.name) &&
    isBoundedString(o.path, MAX_PATH_LEN) &&
    isNonNegativeInteger(o.size) &&
    isBoundedString(o.driveKey, MAX_ID_LEN) &&
    isOptionalBoundedString(o.content, MAX_PATH_LEN)
  )
}

export function isValidControlMessage(x: unknown): x is PeerControlMessage {
  if (!x || typeof x !== 'object') return false
  const m = x as { type?: unknown; protocolVersion?: unknown }

  if (m.protocolVersion !== PROTOCOL_VERSION) return false

  switch (m.type) {
    case 'transfer-start': {
      const v = x as Partial<TransferStart>
      return (
        isBoundedString(v.transferId, MAX_ID_LEN) &&
        isNonNegativeInteger(v.totalFiles, MAX_FILES_PER_TRANSFER) &&
        isNonNegativeInteger(v.totalBytes)
      )
    }
    case 'transfer-ready': {
      const v = x as Partial<TransferReady>
      return (
        isBoundedString(v.transferId, MAX_ID_LEN) &&
        Array.isArray(v.files) &&
        v.files.length <= MAX_FILES_PER_TRANSFER &&
        v.files.every(isValidFileOffer)
      )
    }
    case 'download-request': {
      const v = x as Partial<DownloadRequest>
      return (
        isBoundedString(v.transferId, MAX_ID_LEN) &&
        isBoundedString(v.fileId, MAX_ID_LEN) &&
        isSafeFileName(v.fileName) &&
        isBoundedString(v.path, MAX_PATH_LEN) &&
        isNonNegativeInteger(v.totalBytes)
      )
    }
    case 'download-progress': {
      const v = x as Partial<DownloadProgress>
      return (
        isBoundedString(v.transferId, MAX_ID_LEN) &&
        isBoundedString(v.fileId, MAX_ID_LEN) &&
        isSafeFileName(v.fileName) &&
        isNonNegativeInteger(v.bytesTransferred) &&
        isNonNegativeInteger(v.totalBytes)
      )
    }
    case 'download-complete': {
      const v = x as Partial<DownloadComplete>
      return (
        isBoundedString(v.transferId, MAX_ID_LEN) &&
        isBoundedString(v.fileId, MAX_ID_LEN) &&
        isSafeFileName(v.fileName)
      )
    }
    case 'download-failed': {
      const v = x as Partial<DownloadFailed>
      return (
        isBoundedString(v.transferId, MAX_ID_LEN) &&
        isBoundedString(v.fileId, MAX_ID_LEN) &&
        isSafeFileName(v.fileName) &&
        isBoundedString(v.message, MAX_MESSAGE_LEN)
      )
    }
    default:
      return false
  }
}
