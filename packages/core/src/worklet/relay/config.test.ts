import b4a from 'b4a'
import { beforeEach, describe, expect, it } from 'vitest'
import { configureRelay, proTokenFor, setRelaySending } from './config'

const RELAY_KEY = 'aa'.repeat(32)
const OTHER_KEY = 'bb'.repeat(32)
const TOKEN = 'signed.token'

function relayKey(): Uint8Array {
  return b4a.from(RELAY_KEY, 'hex')
}

describe('proTokenFor', () => {
  beforeEach(() => {
    configureRelay({
      enabled: true,
      relays: [{ keyHex: RELAY_KEY, host: '1.2.3.4' }],
      proToken: TOKEN
    })
    setRelaySending(true)
  })

  it('announces to a known relay while sending', () => {
    expect(proTokenFor(relayKey())).toBe(TOKEN)
  })

  it('stays silent while receiving', () => {
    setRelaySending(false)
    expect(proTokenFor(relayKey())).toBeNull()
  })

  it('stays silent with no token', () => {
    configureRelay({ proToken: null })
    expect(proTokenFor(relayKey())).toBeNull()
  })

  it('never announces to a key that is not a configured relay', () => {
    expect(proTokenFor(b4a.from(OTHER_KEY, 'hex'))).toBeNull()
  })

  it('keeps the token when unrelated config changes', () => {
    configureRelay({ enabled: true })
    expect(proTokenFor(relayKey())).toBe(TOKEN)
  })
})
