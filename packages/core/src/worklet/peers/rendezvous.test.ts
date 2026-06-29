import { describe, it, expect } from 'vitest'
import b4a from 'b4a'
import crypto from 'hypercore-crypto'
import {
  deriveRendezvousTopic,
  RENDEZVOUS_TOPIC_LEN,
  DEVICE_PUBKEY_LEN,
  HANDSHAKE_HASH_LEN
} from './rendezvous'

const pubA = crypto.keyPair().publicKey
const pubB = crypto.keyPair().publicKey
const pubC = crypto.keyPair().publicKey
const hash1 = crypto.randomBytes(HANDSHAKE_HASH_LEN)
const hash2 = crypto.randomBytes(HANDSHAKE_HASH_LEN)

describe('deriveRendezvousTopic', () => {
  it('produces a 32-byte topic', () => {
    const topic = deriveRendezvousTopic(pubA, pubB, hash1)
    expect(topic.byteLength).toBe(RENDEZVOUS_TOPIC_LEN)
  })

  it('is deterministic for the same inputs', () => {
    const a = deriveRendezvousTopic(pubA, pubB, hash1)
    const b = deriveRendezvousTopic(pubA, pubB, hash1)
    expect(b4a.equals(a, b)).toBe(true)
  })

  it('is symmetric — both peers derive the same topic regardless of key order', () => {
    const fromA = deriveRendezvousTopic(pubA, pubB, hash1)
    const fromB = deriveRendezvousTopic(pubB, pubA, hash1)
    expect(b4a.equals(fromA, fromB)).toBe(true)
  })

  it('differs when the pairwise session secret differs', () => {
    const s1 = deriveRendezvousTopic(pubA, pubB, hash1)
    const s2 = deriveRendezvousTopic(pubA, pubB, hash2)
    expect(b4a.equals(s1, s2)).toBe(false)
  })

  it('differs for a different peer pair (third peer cannot collide)', () => {
    const ab = deriveRendezvousTopic(pubA, pubB, hash1)
    const ac = deriveRendezvousTopic(pubA, pubC, hash1)
    expect(b4a.equals(ab, ac)).toBe(false)
  })

  it('rejects mis-sized inputs', () => {
    const short = b4a.alloc(DEVICE_PUBKEY_LEN - 1)
    expect(() => deriveRendezvousTopic(short, pubB, hash1)).toThrow()
    expect(() => deriveRendezvousTopic(pubA, pubB, b4a.alloc(8))).toThrow()
  })

  it('accepts the real 64-byte Noise handshake hash', () => {
    expect(HANDSHAKE_HASH_LEN).toBe(64)
    const topic = deriveRendezvousTopic(pubA, pubB, b4a.alloc(64, 7))
    expect(topic.byteLength).toBe(RENDEZVOUS_TOPIC_LEN)
  })
})
