import type { useRouter } from 'expo-router'

type Router = ReturnType<typeof useRouter>

export function exitToReceiveTab(router: Router): void {
  if (router.canDismiss()) {
    router.dismissTo('/(tabs)/receive')
    return
  }
  router.replace('/(tabs)/receive')
}
