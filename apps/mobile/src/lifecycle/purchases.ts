import { Platform } from 'react-native'
import * as Crypto from 'expo-crypto'
import Purchases, {
  PURCHASES_ERROR_CODE,
  type CustomerInfo,
  type PurchasesPackage
} from 'react-native-purchases'
import type { BillingPlan, PlanOffer, PurchaseAdapter, PurchaseOutcome } from '@altersend/domain'

const PRO_ENTITLEMENT = 'pro'

const APPLE_SUBSCRIPTIONS_URL = 'https://apps.apple.com/account/subscriptions'

const apiKey =
  Platform.OS === 'ios'
    ? process.env.EXPO_PUBLIC_REVENUECAT_IOS_KEY
    : process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_KEY

export const purchasesReady = Boolean(apiKey)

export function startPurchases(onEntitlementChange?: () => void): void {
  if (!apiKey) return

  try {
    Purchases.configure({ apiKey })
    if (onEntitlementChange) {
      Purchases.addCustomerInfoUpdateListener((_info: CustomerInfo) => onEntitlementChange())
    }
  } catch (err) {
    console.warn('[purchases] could not configure RevenueCat', err)
  }
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
  async offers() {
    if (!apiKey) return []

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
    if (!apiKey) return APPLE_SUBSCRIPTIONS_URL
    const info = await Purchases.getCustomerInfo()
    return info.managementURL ?? APPLE_SUBSCRIPTIONS_URL
  },

  async identify(code) {
    const hash = await Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, code)
    await Purchases.logIn(hash)
  },

  async buy(plan): Promise<PurchaseOutcome> {
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
    return isPro(await Purchases.restorePurchases())
  }
}
