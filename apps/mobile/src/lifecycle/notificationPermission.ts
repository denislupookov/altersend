import { AppState, PermissionsAndroid, Platform } from 'react-native'

const NOTIFICATION_PERMISSION_SDK = 33

let requested = false

export async function requestNotificationPermission(): Promise<void> {
  if (requested || Platform.OS !== 'android') return

  const version = Platform.Version
  if (typeof version === 'number' && version < NOTIFICATION_PERMISSION_SDK) return
  if (AppState.currentState !== 'active') return

  requested = true
  await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS)
}
