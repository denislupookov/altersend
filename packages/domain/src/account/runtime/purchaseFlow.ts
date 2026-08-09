import type { AccountAction, BillingPlan } from '../core'
import type { AccountStorage, PurchaseAdapter } from '../ports'
import type { AccountClient, AccountStatus } from '../transport'

export interface PurchaseContext {
  client: AccountClient
  storage: AccountStorage
  purchases?: PurchaseAdapter
  openUrl(url: string): Promise<void>
  syncToken(): Promise<unknown>
  dispatch(action: AccountAction): void
  poll(code: string): void
  discard(code: string): Promise<void>
}

export interface ReservedCode {
  code: string
  fresh: boolean
}

const warn = (context: string, err: unknown) => console.warn(`[account] ${context}`, err)

export async function reserveCode(ctx: PurchaseContext): Promise<ReservedCode> {
  const stored = await ctx.storage.read()

  if (stored) {
    const existing = await ctx.client.status(stored)
    if (existing.exists) return { code: stored, fresh: false }
  }

  const created = await ctx.client.create()
  await ctx.storage.write(created.code)
  return { code: created.code, fresh: true }
}

export async function abandon(ctx: PurchaseContext, reserved: ReservedCode): Promise<void> {
  if (reserved.fresh) await ctx.discard(reserved.code)
}

async function creditFromStore(ctx: PurchaseContext, code: string): Promise<AccountStatus | null> {
  try {
    return await ctx.client.syncStore(code)
  } catch (err) {
    warn('store sync failed, falling back to polling', err)
    return null
  }
}

async function settle(ctx: PurchaseContext, code: string): Promise<void> {
  const credited = await creditFromStore(ctx, code)

  ctx.dispatch({
    type: 'purchased',
    account: { code, validUntil: credited?.validUntil ?? null }
  })
  await ctx.syncToken()

  if (!credited?.active) ctx.poll(code)
}

export async function buyFromStore(
  ctx: PurchaseContext,
  reserved: ReservedCode,
  plan: BillingPlan
): Promise<boolean> {
  const { purchases } = ctx
  if (!purchases) return false

  const { code } = reserved
  await purchases.identify(code)
  const outcome = await purchases.buy(plan)

  if (outcome === 'cancelled') {
    await abandon(ctx, reserved)
    return false
  }

  if (outcome === 'pending') {
    ctx.dispatch({ type: 'awaitingApproval', account: { code, validUntil: null } })
    ctx.poll(code)
    return true
  }

  await settle(ctx, code)
  return true
}

export async function buyWithCard(
  ctx: PurchaseContext,
  reserved: ReservedCode,
  plan: BillingPlan
): Promise<boolean> {
  const { code } = reserved

  ctx.dispatch({ type: 'upgrading', account: { code, validUntil: null } })
  await ctx.openUrl(await ctx.client.checkout(code, plan))
  ctx.poll(code)
  return true
}

export type RestoreOutcome = 'restored' | 'nothingToRestore' | 'notMoved'

export async function restoreFromStore(ctx: PurchaseContext): Promise<RestoreOutcome> {
  const { purchases } = ctx
  if (!purchases) return 'nothingToRestore'

  const stored = await ctx.storage.read()
  if (stored) await purchases.identify(stored)
  if (!(await purchases.restore())) return 'nothingToRestore'

  const reserved = await reserveCode(ctx)
  if (reserved.fresh) await purchases.identify(reserved.code)

  const status = await ctx.client.syncStore(reserved.code)
  if (!status.active) {
    if (reserved.fresh) await abandon(ctx, reserved)
    return 'notMoved'
  }

  ctx.dispatch({
    type: 'activated',
    account: { code: reserved.code, validUntil: status.validUntil ?? null }
  })
  await ctx.syncToken()

  return 'restored'
}
