import crypto from 'hypercore-crypto'
import b4a from 'b4a'

export function topicProof(topicHex: string, nonceHex: string): string {
  const topic = b4a.from(topicHex, 'hex')
  const nonce = b4a.from(nonceHex, 'hex')
  return b4a.toString(crypto.hash(b4a.concat([topic, nonce])), 'hex')
}
