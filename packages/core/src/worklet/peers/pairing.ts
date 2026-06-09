import b4a from 'b4a'
import type { DeviceIdentity, DeviceType } from '../identity/device-identity-store'
import type { PairingInfo } from '../transfer/control-channel'
import { deriveRendezvousTopic } from './rendezvous'

export interface DeviceCapabilities {
  canBackground: boolean
}

export function buildPairingInfo(
  identity: DeviceIdentity,
  capabilities: DeviceCapabilities
): PairingInfo {
  return {
    type: 'pairing-info',
    devicePubkey: b4a.toString(identity.publicKey, 'hex'),
    displayName: identity.displayName,
    deviceType: identity.deviceType,
    capabilities
  }
}

export interface PendingPairing {
  remoteDevicePubkey: Uint8Array
  remoteDisplayName: string
  remoteDeviceType: DeviceType
  remoteCanBackground: boolean
  rendezvousTopic: Uint8Array
}

export function computePendingPairing(
  localPublicKey: Uint8Array,
  remote: PairingInfo,
  sessionHandshakeHash: Uint8Array
): PendingPairing {
  const remoteDevicePubkey = b4a.from(remote.devicePubkey, 'hex')
  const rendezvousTopic = deriveRendezvousTopic(
    localPublicKey,
    remoteDevicePubkey,
    sessionHandshakeHash
  )
  return {
    remoteDevicePubkey,
    remoteDisplayName: remote.displayName,
    remoteDeviceType: remote.deviceType,
    remoteCanBackground: remote.capabilities.canBackground,
    rendezvousTopic
  }
}
