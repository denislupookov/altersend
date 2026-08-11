import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from 'react'
import {
  accountErrorKey,
  accountReducer,
  formatAccountCodeInput,
  initialAccountSession,
  isAccountCodeReady,
  isValidAccountCode,
  normalizeAccountCode,
  type AccountPhase,
  type AccountState,
  type BillingPlan,
  type PlanPrices
} from '../core'
import type { AccountStorage, PurchaseAdapter } from '../ports'
import { classifyAccountError, type AccountClient, type AccountStatus } from '../transport'
import {
  abandon,
  assertHttpsUrl,
  buyFromStore,
  buyWithCard,
  reserveCode,
  restoreFromStore,
  type PurchaseContext,
  type ReservedCode
} from './purchaseFlow'
import { isSubscriptionActive, useSubscriptionStore } from './store'
import { useEntitlementPoll } from './useEntitlementPoll'
import { usePlanPrices } from './usePlanPrices'
import { useStoreAvailability } from './useStoreAvailability'

export interface AccountAdapter {
  client: AccountClient
  storage: AccountStorage
  openUrl(url: string): Promise<void>
  syncToken(): Promise<unknown>
  purchases?: PurchaseAdapter
}

interface AccountStoreActions {
  restore(): Promise<boolean>
}

interface AccountSubscriptionActions {
  logOut(): void
  manage(): void
  cancel(): void
  managedByStore: boolean
  cancelling: boolean
  endsAt: string | null
  canManage: boolean
}

export interface AccountModel {
  phase: AccountPhase
  account: AccountState | null
  busy: boolean
  errorKey: string | null
  entry: string
  codeReady: boolean
  rotated: boolean
  storeUnavailable: boolean
  plan: BillingPlan
  prices: PlanPrices
  store?: AccountStoreActions
  subscription: AccountSubscriptionActions
  clearError(): void
  setEntry(input: string): void
  choosePlan(plan: BillingPlan): void
  prepareStore(): void
  showEntry(): void
  showPaywall(): void
  startUpgrade(): void
  retryUpgrade(): void
  cancelUpgrade(): void
  activate(): Promise<boolean>
  acknowledge(): void
}

const warn = (context: string, err: unknown) => console.warn(`[account] ${context}`, err)

export function useAccount(adapter: AccountAdapter): AccountModel {
  const { client, storage, openUrl, syncToken, purchases } = adapter
  const [session, dispatch] = useReducer(accountReducer, initialAccountSession)
  const [storeRequested, setStoreRequested] = useState(false)
  const storeUnavailable = useStoreAvailability(storeRequested ? purchases : undefined)
  const prices = usePlanPrices(client, purchases, storeRequested)
  const inFlight = useRef(false)
  const pending = useRef<ReservedCode | null>(null)

  const creditPurchase = useCallback(
    async (code: string, status: AccountStatus) => {
      pending.current = null
      dispatch({
        type: 'purchased',
        account: { code, validUntil: status.validUntil ?? null, provider: status.provider }
      })
      await syncToken()
    },
    [syncToken]
  )

  const reportTimeout = useCallback(() => dispatch({ type: 'failed', error: 'timedOut' }), [])

  const { start: pollUntilActive, stop: stopPolling } = useEntitlementPoll({
    client,
    onActive: creditPurchase,
    onTimeout: reportTimeout
  })

  const run = useCallback(async (action: () => Promise<boolean>): Promise<boolean> => {
    if (inFlight.current) return false

    inFlight.current = true
    dispatch({ type: 'started' })

    try {
      const ok = await action()
      dispatch({ type: 'settled' })
      return ok
    } catch (err) {
      warn('action failed', err)
      dispatch({ type: 'failed', error: classifyAccountError(err) })
      return false
    } finally {
      inFlight.current = false
    }
  }, [])

  const forget = useCallback(async () => {
    pending.current = null
    stopPolling()
    await storage.clear()
    dispatch({ type: 'forgotten' })

    await syncToken()
  }, [stopPolling, storage, syncToken])

  const discard = useCallback(
    async (code: string) => {
      await client.remove(code).catch((err) => warn('orphan cleanup failed', err))
      await forget()
    },
    [client, forget]
  )

  useEffect(() => {
    let cancelled = false

    storage
      .read()
      .then(async (code) => {
        if (!code || cancelled) return

        if (isSubscriptionActive()) {
          dispatch({ type: 'activated', account: { code, validUntil: null } })
        }

        const status = await client.status(code)
        if (cancelled) return

        if (!status.exists) {
          await storage.clear()
          dispatch({ type: 'forgotten' })
          return
        }

        if (status.active) {
          dispatch({
            type: 'activated',
            account: { code, validUntil: status.validUntil ?? null, provider: status.provider }
          })
          return
        }

        dispatch({ type: 'showPaywall' })
      })
      .catch((err) => warn('status lookup failed', err))

    return () => {
      cancelled = true
    }
  }, [client, storage])

  const subscriptionActive = useSubscriptionStore((state) => state.active)

  useEffect(() => {
    if (!subscriptionActive || session.phase !== 'paywall' || session.account) return

    let cancelled = false
    storage
      .read()
      .then((code) => {
        if (code && !cancelled) dispatch({ type: 'activated', account: { code, validUntil: null } })
      })
      .catch((err) => warn('cached entitlement lookup failed', err))

    return () => {
      cancelled = true
    }
  }, [session.account, session.phase, storage, subscriptionActive])

  const context = useMemo<PurchaseContext>(
    () => ({
      client,
      storage,
      purchases,
      openUrl,
      syncToken,
      dispatch,
      poll: pollUntilActive,
      discard
    }),
    [client, discard, openUrl, pollUntilActive, purchases, storage, syncToken]
  )

  const startUpgrade = useCallback(() => {
    if (storeUnavailable) return

    run(async () => {
      const reserved = await reserveCode(context)
      pending.current = reserved

      try {
        return context.purchases
          ? await buyFromStore(context, reserved, session.plan)
          : await buyWithCard(context, reserved, session.plan)
      } catch (err) {
        await abandon(context, reserved)
        throw err
      }
    })
  }, [context, run, session.plan, storeUnavailable])

  const restore = useCallback(() => {
    return run(async () => {
      const outcome = await restoreFromStore(context)

      if (outcome === 'nothingToRestore') {
        dispatch({ type: 'failed', error: 'nothingToRestore' })
        return false
      }

      if (outcome === 'notMoved') {
        dispatch({ type: 'failed', error: 'restoreNotMoved' })
        return false
      }

      return true
    })
  }, [context, run])

  const store = useMemo<AccountStoreActions | undefined>(
    () => (purchases && !storeUnavailable ? { restore } : undefined),
    [purchases, restore, storeUnavailable]
  )

  const retryUpgrade = useCallback(() => {
    if (!session.account) return

    dispatch({ type: 'upgrading', account: session.account })
    pollUntilActive(session.account.code)
  }, [pollUntilActive, session.account])

  const cancelUpgrade = useCallback(() => {
    const reserved = pending.current
    run(async () => {
      stopPolling()
      pending.current = null

      if (reserved?.fresh) await abandon(context, reserved)
      else if (!reserved) await forget()
      else dispatch({ type: 'showPaywall' })

      return true
    })
  }, [context, forget, run, stopPolling])

  const activate = useCallback(
    () =>
      run(async () => {
        const code = normalizeAccountCode(session.entry)
        if (!isValidAccountCode(code)) {
          dispatch({ type: 'failed', error: 'unknownCode' })
          return false
        }

        const status = await client.status(code)
        if (!status.exists) {
          dispatch({ type: 'failed', error: 'unknownCode' })
          return false
        }

        if (!status.active) {
          dispatch({ type: 'failed', error: 'expiredCode' })
          return false
        }

        await storage.write(code)
        dispatch({
          type: 'activated',
          account: { code, validUntil: status.validUntil ?? null, provider: status.provider }
        })
        await syncToken()

        return true
      }),
    [client, run, session.entry, storage, syncToken]
  )

  const managedByStore = session.account?.provider === 'revenuecat'
  const [billing, setBilling] = useState<{
    cancelling: boolean
    endsAt: string | null
    loaded: boolean
  }>({ cancelling: false, endsAt: null, loaded: false })

  const activeCode = session.phase === 'active' ? session.account?.code : undefined
  const latestCode = useRef(activeCode)
  latestCode.current = activeCode

  const readBilling = useCallback(async () => {
    setBilling({ cancelling: false, endsAt: null, loaded: false })

    if (!activeCode) return
    if (managedByStore) {
      setBilling({ cancelling: false, endsAt: null, loaded: true })
      return
    }

    const state = await client.subscription(activeCode).catch((err) => {
      warn('subscription lookup failed', err)
      return null
    })

    if (activeCode !== latestCode.current) return

    setBilling({
      cancelling: state?.cancelling ?? false,
      endsAt: state?.endsAt ?? null,
      loaded: state !== null
    })
  }, [activeCode, client, managedByStore])

  useEffect(() => {
    readBilling()
  }, [readBilling])

  const manage = useCallback(() => {
    run(async () => {
      if (!session.account) return false

      const url = managedByStore && purchases ? await purchases.managementUrl() : null
      if (!url) return false

      await openUrl(assertHttpsUrl(url, 'manage'))
      return true
    })
  }, [managedByStore, openUrl, purchases, run, session.account])

  const cancel = useCallback(() => {
    run(async () => {
      if (!session.account) return false

      await client.cancel(session.account.code)
      await readBilling()

      return true
    })
  }, [client, readBilling, run, session.account])

  const logOut = useCallback(() => {
    run(async () => {
      await forget()

      return true
    })
  }, [forget, run])

  const subscription = useMemo<AccountSubscriptionActions>(
    () => ({
      logOut,
      manage,
      cancel,
      managedByStore,
      cancelling: billing.cancelling,
      endsAt: billing.endsAt,
      canManage: billing.loaded && !billing.cancelling
    }),
    [billing.cancelling, billing.endsAt, billing.loaded, cancel, logOut, manage, managedByStore]
  )

  const setEntry = useCallback(
    (input: string) => dispatch({ type: 'entryChanged', entry: formatAccountCodeInput(input) }),
    []
  )

  const choosePlan = useCallback((plan: BillingPlan) => dispatch({ type: 'planChosen', plan }), [])
  const clearError = useCallback(() => dispatch({ type: 'errorCleared' }), [])
  const showEntry = useCallback(() => dispatch({ type: 'showEntry' }), [])
  const showPaywall = useCallback(() => dispatch({ type: 'showPaywall' }), [])
  const acknowledge = useCallback(() => dispatch({ type: 'acknowledged' }), [])
  const prepareStore = useCallback(() => setStoreRequested(true), [])

  return useMemo(
    () => ({
      phase: session.phase,
      account: session.account,
      busy: session.busy,
      errorKey: accountErrorKey(session.error),
      entry: session.entry,
      codeReady: isAccountCodeReady(session.entry),
      rotated: session.rotated,
      storeUnavailable,
      plan: session.plan,
      prices,
      store,
      subscription,
      clearError,
      setEntry,
      choosePlan,
      prepareStore,
      showEntry,
      showPaywall,
      startUpgrade,
      retryUpgrade,
      cancelUpgrade,
      activate,
      acknowledge
    }),
    [
      acknowledge,
      activate,
      cancelUpgrade,
      choosePlan,
      clearError,
      prepareStore,
      prices,
      retryUpgrade,
      session,
      setEntry,
      showEntry,
      showPaywall,
      startUpgrade,
      store,
      storeUnavailable,
      subscription
    ]
  )
}
