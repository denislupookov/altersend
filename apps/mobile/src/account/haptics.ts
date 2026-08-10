import * as Haptics from 'expo-haptics'

const warn = (err: unknown) => console.warn('[account] haptic failed', err)

export function selectionTap(): void {
  Haptics.selectionAsync().catch(warn)
}

export function impactTap(): Promise<void> {
  return Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
}

export function successTap(): void {
  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(warn)
}
