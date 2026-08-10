import { create } from 'zustand'

interface SubscriptionState {
  active: boolean
}

const subscriptionStore = create<SubscriptionState>()(() => ({ active: false }))

export const useSubscriptionStore = subscriptionStore

export function setSubscriptionActive(active: boolean): void {
  subscriptionStore.setState({ active })
}

export function isSubscriptionActive(): boolean {
  return subscriptionStore.getState().active
}
