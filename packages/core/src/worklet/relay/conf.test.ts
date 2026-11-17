import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { configureRelay, isOfficialRelayHost } from './config'
import { whenOfficialRelaysKnown, whenRelayConfReady } from './conf'

beforeEach(() => {
  configureRelay({ enabled: false, relays: [] })
})

afterEach(() => {
  configureRelay({ enabled: false, relays: [] })
})

describe('relay/conf', () => {
  it('resolves immediately when relaying is disabled', async () => {
    await expect(whenRelayConfReady(50)).resolves.toBeUndefined()
  })

  it('resolves immediately when no conf pubkey was provided', async () => {
    configureRelay({ enabled: true })
    await expect(whenRelayConfReady(50)).resolves.toBeUndefined()
  })

  it('knows the official relays without waiting when no conf pubkey was provided', async () => {
    await expect(whenOfficialRelaysKnown(50)).resolves.toBeUndefined()
  })

  it('recognises official relays while relaying is disabled', () => {
    configureRelay({ enabled: false, relays: [{ keyHex: 'ab'.repeat(32), host: '203.0.113.7' }] })
    expect(isOfficialRelayHost('203.0.113.7')).toBe(true)
  })

  it('does not reject when the wait times out', async () => {
    configureRelay({ enabled: true })
    await expect(whenRelayConfReady(1)).resolves.toBeUndefined()
  })
})
