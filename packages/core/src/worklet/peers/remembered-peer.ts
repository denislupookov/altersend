import { isValidHexKey } from '../transfer/utils'
import { isDeviceType, type DeviceType } from '../identity/device-type'

export interface RememberedPeer {
  remoteDevicePubkey: string
  rendezvousTopic: string
  displayName: string
  deviceType: DeviceType
  isMine: boolean
  autoAccept: boolean
  blocked: boolean
  pairedAt: number
  lastSeenAt: number
}

const MAX_DISPLAY_NAME_LEN = 256

function isBoundedString(x: unknown, maxLen: number): x is string {
  return typeof x === 'string' && x.length > 0 && x.length <= maxLen
}

function isTimestamp(x: unknown): x is number {
  return typeof x === 'number' && Number.isFinite(x) && x >= 0
}

export function isValidRememberedPeer(x: unknown): x is RememberedPeer {
  if (!x || typeof x !== 'object') return false
  const p = x as Partial<RememberedPeer>
  return (
    isValidHexKey(p.remoteDevicePubkey) &&
    isValidHexKey(p.rendezvousTopic) &&
    isBoundedString(p.displayName, MAX_DISPLAY_NAME_LEN) &&
    isDeviceType(p.deviceType) &&
    typeof p.isMine === 'boolean' &&
    typeof p.autoAccept === 'boolean' &&
    typeof p.blocked === 'boolean' &&
    isTimestamp(p.pairedAt) &&
    isTimestamp(p.lastSeenAt)
  )
}

export function mergeRememberedPeer(
  existing: RememberedPeer | null,
  incoming: RememberedPeer
): RememberedPeer {
  if (!existing) return incoming
  return {
    ...existing,
    deviceType: incoming.deviceType,
    rendezvousTopic: incoming.rendezvousTopic,
    lastSeenAt: incoming.lastSeenAt
  }
}
