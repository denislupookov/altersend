import b4a from 'b4a'
import crypto from 'hypercore-crypto'

export const DEVICE_PUBKEY_LEN = 32
export const RENDEZVOUS_TOPIC_LEN = 32
export const HANDSHAKE_HASH_LEN = 64
const MIN_HANDSHAKE_HASH_LEN = 32

const RENDEZVOUS_CONTEXT = b4a.from('altersend-rendezvous-v1')

function assertLen(name: string, value: Uint8Array, len: number): void {
  if (!value || value.byteLength !== len) {
    throw new Error(`rendezvous: ${name} must be ${len} bytes, got ${value?.byteLength}`)
  }
}

function assertMinLen(name: string, value: Uint8Array, min: number): void {
  if (!value || value.byteLength < min) {
    throw new Error(`rendezvous: ${name} must be at least ${min} bytes, got ${value?.byteLength}`)
  }
}

function sortKeys(a: Uint8Array, b: Uint8Array): [Uint8Array, Uint8Array] {
  return b4a.compare(a, b) <= 0 ? [a, b] : [b, a]
}

export function deriveRendezvousTopic(
  localDevicePubkey: Uint8Array,
  remoteDevicePubkey: Uint8Array,
  sessionHandshakeHash: Uint8Array
): Uint8Array {
  assertLen('localDevicePubkey', localDevicePubkey, DEVICE_PUBKEY_LEN)
  assertLen('remoteDevicePubkey', remoteDevicePubkey, DEVICE_PUBKEY_LEN)
  assertMinLen('sessionHandshakeHash', sessionHandshakeHash, MIN_HANDSHAKE_HASH_LEN)

  const [first, second] = sortKeys(localDevicePubkey, remoteDevicePubkey)
  return crypto.hash([RENDEZVOUS_CONTEXT, first, second, sessionHandshakeHash])
}
