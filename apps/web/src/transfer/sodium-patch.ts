import sodium from 'sodium-universal'
import { ed25519 } from '@noble/curves/ed25519.js'

const Point = ed25519.Point
const L = Point.Fn.ORDER

function bytesToNumberLE(bytes: Uint8Array): bigint {
  let n = 0n
  for (let i = bytes.length - 1; i >= 0; i--) n = (n << 8n) | BigInt(bytes[i])
  return n
}

const s = sodium as unknown as Record<string, unknown>

if (s.crypto_scalarmult_ed25519_BYTES === undefined) {
  s.crypto_scalarmult_ed25519_BYTES = 32
}

if (typeof s.crypto_scalarmult_ed25519_noclamp !== 'function') {
  s.crypto_scalarmult_ed25519_noclamp = (
    q: Uint8Array,
    n: Uint8Array,
    p: Uint8Array
  ): Uint8Array => {
    const scalar = bytesToNumberLE(n) % L
    q.set(Point.fromBytes(p).multiplyUnsafe(scalar).toBytes())
    return q
  }
}
