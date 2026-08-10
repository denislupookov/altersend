import { describe, expect, it } from 'vitest'
import type { AccountAction } from '../core'
import {
  abandon,
  assertHttpsUrl,
  buyFromStore,
  restoreFromStore,
  type PurchaseContext
} from './purchaseFlow'

interface Options {
  stored?: string | null
  storedExists?: boolean
  restored?: boolean
  active?: boolean
  alreadyPaid?: boolean
}

function makeContext({
  stored = null,
  storedExists = true,
  restored = true,
  active = true,
  alreadyPaid = false
}: Options) {
  const actions: AccountAction[] = []
  const discarded: string[] = []
  const polled: string[] = []
  let written = stored

  const ctx = {
    client: {
      status: async () => ({
        exists: storedExists,
        active: alreadyPaid,
        validUntil: alreadyPaid ? '2030-01-01' : null
      }),
      create: async () => ({ code: 'new-code' }),
      syncStore: async () => ({ exists: true, active, validUntil: active ? '2030-01-01' : null })
    },
    storage: {
      read: async () => written,
      write: async (code: string) => {
        written = code
      },
      clear: async () => {
        written = null
      }
    },
    purchases: {
      identify: async () => {},
      restore: async () => restored,
      buy: async () => 'bought'
    },
    openUrl: async () => {},
    syncToken: async () => true,
    dispatch: (action: AccountAction) => actions.push(action),
    poll: (code: string) => {
      polled.push(code)
    },
    discard: async (code: string) => {
      discarded.push(code)
    }
  } as unknown as PurchaseContext

  return { ctx, actions, discarded, polled, code: () => written }
}

describe('restoreFromStore', () => {
  it('flags a restore that had to mint a new code', async () => {
    const { ctx, actions } = makeContext({ stored: null })

    expect(await restoreFromStore(ctx)).toBe('restored')
    expect(actions).toEqual([
      { type: 'purchased', account: { code: 'new-code', validUntil: '2030-01-01' }, rotated: true }
    ])
  })

  it('keeps a stored code and activates without flagging a rotation', async () => {
    const { ctx, actions } = makeContext({ stored: 'kept-code' })

    expect(await restoreFromStore(ctx)).toBe('restored')
    expect(actions).toEqual([
      { type: 'activated', account: { code: 'kept-code', validUntil: '2030-01-01' } }
    ])
  })

  it('discards a minted code when the store has nothing to restore', async () => {
    const { ctx, actions, discarded } = makeContext({ stored: null, restored: false })

    expect(await restoreFromStore(ctx)).toBe('nothingToRestore')
    expect(discarded).toEqual(['new-code'])
    expect(actions).toEqual([])
  })

  it('discards a minted code when the purchase did not move', async () => {
    const { ctx, discarded } = makeContext({ stored: null, active: false })

    expect(await restoreFromStore(ctx)).toBe('notMoved')
    expect(discarded).toEqual(['new-code'])
  })
})

describe('buyFromStore', () => {
  it('waits for the entitlement instead of claiming success', async () => {
    const { ctx, actions, polled } = makeContext({ stored: 'kept-code', active: false })

    expect(await buyFromStore(ctx, { code: 'kept-code', fresh: false }, 'monthly')).toBe(true)
    expect(actions.map((a) => a.type)).toEqual(['awaitingApproval'])
    expect(polled).toEqual(['kept-code'])
  })

  it('reports success once the entitlement is confirmed', async () => {
    const { ctx, actions, polled } = makeContext({ stored: 'kept-code' })

    expect(await buyFromStore(ctx, { code: 'kept-code', fresh: false }, 'monthly')).toBe(true)
    expect(actions.map((a) => a.type)).toEqual(['purchased'])
    expect(polled).toEqual([])
  })
})

describe('assertHttpsUrl', () => {
  it('passes https urls through', () => {
    expect(assertHttpsUrl('https://checkout.stripe.com/c/pay/x', 'checkout')).toBe(
      'https://checkout.stripe.com/c/pay/x'
    )
  })

  it('rejects any other scheme', () => {
    expect(() => assertHttpsUrl('file:///etc/passwd', 'checkout')).toThrow()
    expect(() => assertHttpsUrl('javascript:alert(1)', 'checkout')).toThrow()
    expect(() => assertHttpsUrl('http://example.com', 'checkout')).toThrow()
  })
})

describe('abandon', () => {
  it('keeps a code the payment already activated instead of deleting it', async () => {
    const { ctx, actions, discarded } = makeContext({ stored: null, alreadyPaid: true })

    await abandon(ctx, { code: 'paid-code', fresh: true })

    expect(discarded).toEqual([])
    expect(actions).toEqual([
      { type: 'purchased', account: { code: 'paid-code', validUntil: '2030-01-01' } }
    ])
  })

  it('discards a freshly minted code that was never paid for', async () => {
    const { ctx, discarded } = makeContext({ stored: null })

    await abandon(ctx, { code: 'new-code', fresh: true })

    expect(discarded).toEqual(['new-code'])
  })
})
