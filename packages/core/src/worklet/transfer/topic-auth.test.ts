import { describe, expect, it } from 'vitest'
import b4a from 'b4a'
import crypto from 'hypercore-crypto'
import { topicProof } from './topic-auth'

describe('topicProof', () => {
  const topic = 'a'.repeat(64)
  const nonce = 'b'.repeat(64)

  it('is hash(topic || nonce) over the raw bytes, hex-encoded', () => {
    const expected = b4a.toString(
      crypto.hash(b4a.concat([b4a.from(topic, 'hex'), b4a.from(nonce, 'hex')])),
      'hex'
    )
    expect(topicProof(topic, nonce)).toBe(expected)
  })

  it('matches a frozen vector', () => {
    expect(topicProof(topic, nonce)).toBe(
      'e4351a237b5150f780837f4ef69b4feb9496b48780cb07a8193803840e71a17c'
    )
  })

  it('is deterministic', () => {
    expect(topicProof(topic, nonce)).toBe(topicProof(topic, nonce))
  })

  it('changes when the nonce changes', () => {
    expect(topicProof(topic, nonce)).not.toBe(topicProof(topic, 'c'.repeat(64)))
  })

  it('changes when the topic changes', () => {
    expect(topicProof(topic, nonce)).not.toBe(topicProof('d'.repeat(64), nonce))
  })

  it('does not confuse the topic/nonce boundary', () => {
    expect(topicProof(topic, nonce)).not.toBe(topicProof(nonce, topic))
  })
})
