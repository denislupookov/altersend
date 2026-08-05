import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { configureRelay } from './config'
import { whenRelayConfReady } from './conf'

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

  it('does not reject when the wait times out', async () => {
    configureRelay({ enabled: true })
    await expect(whenRelayConfReady(1)).resolves.toBeUndefined()
  })
})
