import { Platform } from 'react-native'
import * as Crypto from 'expo-crypto'
import Purchases, {
  PURCHASES_ERROR_CODE,
  type CustomerInfo,
  type PurchasesPackage
} from 'react-native-purchases'
import type { BillingPlan, PlanOffer, PurchaseAdapter, PurchaseOutcome } from '@altersend/domain'

const PRO_ENTITLEMENT = 'pro'

const apiKey =
  Platform.OS === 'ios'
    ? process.env.EXPO_PUBLIC_REVENUECAT_IOS_KEY
    : process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_KEY

export const purchasesReady = Boolean(apiKey)

let configured = false
let onEntitlementChange: (() => void) | null = null

export function watchEntitlement(listener: () => void): void {
  onEntitlementChange = listener
}

function ensureConfigured(): boolean {
  if (!apiKey) return false
  if (configured) return true

  try {
    Purchases.configure({ apiKey })
    Purchases.addCustomerInfoUpdateListener((_info: CustomerInfo) => onEntitlementChange?.())
    configured = true
  } catch (err) {
    console.warn('[purchases] could not configure RevenueCat', err)
    return false
  }

  return true
}

function errorCode(err: unknown): string | null {
  if (!err || typeof err !== 'object' || !('code' in err)) return null
  return String((err as { code: unknown }).code)
}

function isUserCancelled(err: unknown): boolean {
  if (Boolean(err && typeof err === 'object' && 'userCancelled' in err && err.userCancelled)) {
    return true
  }
  return errorCode(err) === PURCHASES_ERROR_CODE.PURCHASE_CANCELLED_ERROR
}

function isPro(customerInfo: { entitlements: { active: Record<string, unknown> } }): boolean {
  return Boolean(customerInfo.entitlements.active[PRO_ENTITLEMENT])
}

async function packageForPlan(plan: BillingPlan): Promise<PurchasesPackage> {
  const offerings = await Purchases.getOfferings()
  const offering = offerings.current
  const selected = plan === 'yearly' ? offering?.annual : offering?.monthly

  if (!selected) {
    throw new Error(`[purchases] no ${plan} package in the current RevenueCat offering`)
  }

  return selected
}

export const purchaseAdapter: PurchaseAdapter = {
  async available() {
    if (!ensureConfigured()) return false

    try {
      if (!(await Purchases.canMakePayments())) return false
      return (await Purchases.getOfferings()).current !== null
    } catch (err) {
      console.warn('[purchases] store unavailable', err)
      return false
    }
  },

  async offers() {
    if (!ensureConfigured()) return []

    const offering = (await Purchases.getOfferings()).current
    if (!offering) return []

    const found: PlanOffer[] = []
    if (offering.monthly) {
      found.push({ plan: 'monthly', price: offering.monthly.product.priceString })
    }
    if (offering.annual) {
      found.push({ plan: 'yearly', price: offering.annual.product.priceString })
    }
    return found
  },

  async managementUrl() {
    if (!ensureConfigured()) return null
    const info = await Purchases.getCustomerInfo()
    return info.managementURL ?? null
  },

  async identify(code) {
    if (!ensureConfigured()) return

    const hash = await Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, code)
    await Purchases.logIn(hash)
  },

  async buy(plan): Promise<PurchaseOutcome> {
    if (!ensureConfigured()) return 'cancelled'

    const selected = await packageForPlan(plan)

    try {
      const { customerInfo } = await Purchases.purchasePackage(selected)
      return isPro(customerInfo) ? 'bought' : 'pending'
    } catch (err) {
      if (isUserCancelled(err)) return 'cancelled'

      const code = errorCode(err)
      if (code === PURCHASES_ERROR_CODE.PRODUCT_ALREADY_PURCHASED_ERROR) return 'owned'
      if (code === PURCHASES_ERROR_CODE.PAYMENT_PENDING_ERROR) return 'pending'

      throw err
    }
  },

  async restore() {
    if (!ensureConfigured()) return false

    return isPro(await Purchases.restorePurchases())
  }
}
