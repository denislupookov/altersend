import { isSafeFileName, isValidHexKey } from './utils'
import { isDeviceType } from '../identity/device-type'
import {
  PROTOCOL_VERSION,
  type DownloadComplete,
  type DownloadFailed,
  type DownloadProgress,
  type DownloadRequest,
  type DeviceInvite,
  type DeviceInviteResponse,
  type FileOffer,
  type TextOffer,
  type PairingInfo,
  type RememberVote,
  type Recognition,
  type PeerControlMessage,
  type TransferReady,
  type TransferStart
} from './control-channel'

const MAX_ID_LEN = 128
const MAX_PATH_LEN = 4096
const MAX_CONTENT_LEN = 65_536
const MAX_MESSAGE_LEN = 1024
const MAX_FILES_PER_TRANSFER = 10_000
const MAX_DISPLAY_NAME_LEN = 256

const SIGNATURE_HEX_RE = /^[0-9a-f]{128}$/i

function isBoundedString(x: unknown, maxLen: number): x is string {
  return typeof x === 'string' && x.length > 0 && x.length <= maxLen
}

function isValidSignatureHex(x: unknown): x is string {
  return typeof x === 'string' && SIGNATURE_HEX_RE.test(x)
}

function _isOptionalBoundedString(x: unknown, maxLen: number): boolean {
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
    o.kind === 'file'
  )
}

function isValidTextOffer(x: unknown): x is TextOffer {
  if (!x || typeof x !== 'object') return false
  const o = x as Partial<TextOffer>
  return (
    isBoundedString(o.id, MAX_ID_LEN) &&
    isBoundedString(o.transferId, MAX_ID_LEN) &&
    o.kind === 'text' &&
    isBoundedString(o.content, MAX_CONTENT_LEN)
  )
}

function isValidTransferOffer(x: unknown): boolean {
  if (!x || typeof x !== 'object') return false
  const kind = (x as { kind?: unknown }).kind
  if (kind === 'file') return isValidFileOffer(x)
  if (kind === 'text') return isValidTextOffer(x)
  return false
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
        v.files.every(isValidTransferOffer)
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
        isSafeFileName(v.fileName) &&
        isBoundedString(v.savedTo, MAX_PATH_LEN)
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
    case 'pairing-info': {
      const v = x as Partial<PairingInfo>
      return (
        isValidHexKey(v.devicePubkey) &&
        isValidSignatureHex(v.signature) &&
        isBoundedString(v.displayName, MAX_DISPLAY_NAME_LEN) &&
        isDeviceType(v.deviceType) &&
        !!v.capabilities &&
        typeof v.capabilities === 'object' &&
        typeof v.capabilities.canBackground === 'boolean'
      )
    }
    case 'remember-vote': {
      const v = x as Partial<RememberVote>
      return (
        isBoundedString(v.transferId, MAX_ID_LEN) &&
        (v.vote === 'remember' || v.vote === 'no') &&
        typeof v.isMine === 'boolean'
      )
    }
    case 'recognition': {
      const v = x as Partial<Recognition>
      return isValidSignatureHex(v.signature)
    }
    case 'invite': {
      const v = x as Partial<DeviceInvite>
      return (
        isBoundedString(v.displayName, MAX_DISPLAY_NAME_LEN) &&
        isDeviceType(v.deviceType) &&
        isBoundedString(v.topic, MAX_ID_LEN) &&
        (v.fileCount === undefined || isNonNegativeInteger(v.fileCount, MAX_FILES_PER_TRANSFER)) &&
        (v.textCount === undefined || isNonNegativeInteger(v.textCount, MAX_FILES_PER_TRANSFER)) &&
        (v.totalSize === undefined || isNonNegativeInteger(v.totalSize))
      )
    }
    case 'invite-response': {
      const v = x as Partial<DeviceInviteResponse>
      return isBoundedString(v.topic, MAX_ID_LEN) && v.response === 'declined'
    }
    default:
      return false
  }
}
