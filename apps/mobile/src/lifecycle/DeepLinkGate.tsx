import { useEffect } from 'react'
import { useNavigationContainerRef } from 'expo-router'
import { markRouterReady } from './deepLinkHandler'

export function DeepLinkGate() {
  const navigationRef = useNavigationContainerRef()

  useEffect(() => {
    const markWhenReady = () => {
      if (navigationRef.isReady()) markRouterReady()
    }

    const unsubscribe = navigationRef.addListener('state', markWhenReady)
    markWhenReady()

    return unsubscribe
  }, [navigationRef])

  return null
}
