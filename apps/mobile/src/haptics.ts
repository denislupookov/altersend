import * as Haptics from 'expo-haptics'

const warn = (err: unknown) => console.warn('[haptics] failed', err)

export function selectionTap(): void {
  Haptics.selectionAsync().catch(warn)
}

export function lightTap(): void {
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(warn)
}

export function mediumTap(): void {
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(warn)
}

export function successTap(): void {
  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(warn)
}

export function errorTap(): void {
  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(warn)
}
