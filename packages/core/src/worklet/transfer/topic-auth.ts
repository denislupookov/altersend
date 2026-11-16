import crypto from 'hypercore-crypto'
import b4a from 'b4a'

export const TOPIC_AUTH_VERSION = 2

export type TopicAuthRole = 'sender' | 'receiver'

const TOPIC_AUTH_CONTEXT = b4a.from('altersend/topic-auth/v2')

const ROLE_TAG: Record<TopicAuthRole, Uint8Array> = {
  sender: b4a.from([1]),
  receiver: b4a.from([2])
}

export function legacyTopicProof(topicHex: string, nonceHex: string): string {
  return b4a.toString(
    crypto.hash(b4a.concat([b4a.from(topicHex, 'hex'), b4a.from(nonceHex, 'hex')])),
    'hex'
  )
}

export function topicProof(
  topicHex: string,
  nonceHex: string,
  handshakeHash: Uint8Array,
  role: TopicAuthRole
): string {
  return b4a.toString(
    crypto.hash([
      TOPIC_AUTH_CONTEXT,
      ROLE_TAG[role],
      b4a.from(topicHex, 'hex'),
      handshakeHash,
      b4a.from(nonceHex, 'hex')
    ]),
    'hex'
  )
}
