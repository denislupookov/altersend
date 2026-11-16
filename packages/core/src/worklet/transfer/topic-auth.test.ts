import { describe, expect, it } from 'vitest'
import b4a from 'b4a'
import crypto from 'hypercore-crypto'
import { legacyTopicProof, topicProof } from './topic-auth'

describe('topicProof', () => {
  const topic = 'a'.repeat(64)
  const nonce = 'b'.repeat(64)
  const handshake = b4a.alloc(64, 0xcc)
  const otherHandshake = b4a.alloc(64, 0xdd)

  it('hashes context, role, topic, handshake hash and nonce over the raw bytes', () => {
    const expected = b4a.toString(
      crypto.hash([
        b4a.from('altersend/topic-auth/v2'),
        b4a.from([2]),
        b4a.from(topic, 'hex'),
        handshake,
        b4a.from(nonce, 'hex')
      ]),
      'hex'
    )
    expect(topicProof(topic, nonce, handshake, 'receiver')).toBe(expected)
  })

  it('is deterministic', () => {
    expect(topicProof(topic, nonce, handshake, 'receiver')).toBe(
      topicProof(topic, nonce, handshake, 'receiver')
    )
  })

  it('changes when the nonce changes', () => {
    expect(topicProof(topic, nonce, handshake, 'receiver')).not.toBe(
      topicProof(topic, 'c'.repeat(64), handshake, 'receiver')
    )
  })

  it('changes when the topic changes', () => {
    expect(topicProof(topic, nonce, handshake, 'receiver')).not.toBe(
      topicProof('d'.repeat(64), nonce, handshake, 'receiver')
    )
  })

  it('cannot be relayed onto a different connection', () => {
    expect(topicProof(topic, nonce, handshake, 'receiver')).not.toBe(
      topicProof(topic, nonce, otherHandshake, 'receiver')
    )
  })

  it('cannot be reflected back as the other role', () => {
    expect(topicProof(topic, nonce, handshake, 'receiver')).not.toBe(
      topicProof(topic, nonce, handshake, 'sender')
    )
  })

  it('no longer matches the unbound legacy proof', () => {
    const legacy = legacyTopicProof(topic, nonce)
    expect(topicProof(topic, nonce, handshake, 'receiver')).not.toBe(legacy)
    expect(topicProof(topic, nonce, handshake, 'sender')).not.toBe(legacy)
  })
})

describe('legacyTopicProof', () => {
  it('matches the frozen vector old receivers produce', () => {
    expect(legacyTopicProof('a'.repeat(64), 'b'.repeat(64))).toBe(
      'e4351a237b5150f780837f4ef69b4feb9496b48780cb07a8193803840e71a17c'
    )
  })
})
