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

export function sanitizeRememberedPeers(raw: unknown): RememberedPeer[] {
  if (!Array.isArray(raw)) return []
  const byKey = new Map<string, RememberedPeer>()
  let dropped = 0
  for (const entry of raw) {
    if (isValidRememberedPeer(entry)) {
      byKey.set(entry.remoteDevicePubkey.toLowerCase(), entry)
    } else {
      dropped++
    }
  }
  if (dropped > 0) {
    console.warn(`RememberedPeerStore: dropped ${dropped} invalid peer entries`)
  }
  return [...byKey.values()]
}

function sameKey(a: string, b: string): boolean {
  return a.toLowerCase() === b.toLowerCase()
}

export function findPeer(peers: RememberedPeer[], pubkeyHex: string): RememberedPeer | null {
  return peers.find((p) => sameKey(p.remoteDevicePubkey, pubkeyHex)) ?? null
}

export function upsertPeer(peers: RememberedPeer[], peer: RememberedPeer): RememberedPeer[] {
  const without = peers.filter((p) => !sameKey(p.remoteDevicePubkey, peer.remoteDevicePubkey))
  return [...without, peer]
}

export function removePeer(peers: RememberedPeer[], pubkeyHex: string): RememberedPeer[] {
  return peers.filter((p) => !sameKey(p.remoteDevicePubkey, pubkeyHex))
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

export function patchPeer(
  peers: RememberedPeer[],
  pubkeyHex: string,
  patch: Partial<Omit<RememberedPeer, 'remoteDevicePubkey'>>
): RememberedPeer[] {
  let changed = false
  const next = peers.map((p) => {
    if (!sameKey(p.remoteDevicePubkey, pubkeyHex)) return p
    changed = true
    return { ...p, ...patch }
  })
  return changed ? next : peers
}
