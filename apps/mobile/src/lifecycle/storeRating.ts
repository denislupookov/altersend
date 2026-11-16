import { Linking, Platform } from 'react-native'
import { playStoreUrl } from '@altersend/domain'

export const RATE_AFTER_DISMISS_MS = 650

type StoreReview = typeof import('expo-store-review')

async function loadStoreReview(): Promise<StoreReview | null> {
  try {
    return await import('expo-store-review')
  } catch (err) {
    console.warn('storeRating: expo-store-review is not in this build', err)
    return null
  }
}

async function requestAppStoreReview(): Promise<void> {
  const api = await loadStoreReview()
  if (!api) return
  const available = await api.isAvailableAsync().catch(() => false)
  if (!available) return
  await api.requestReview()
}

export async function requestStoreRating(): Promise<void> {
  if (Platform.OS === 'android') {
    await Linking.openURL(playStoreUrl)
    return
  }
  await requestAppStoreReview()
}
