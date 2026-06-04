import { useEffect, useState } from 'react'
import { bridgeApi, hasBridge } from '../api/bridgeApi'

// runtime:updated is a one-shot broadcast, so register on app mount — not when
// the banner mounts — to avoid missing it during onboarding or loading.
export function useUpdateReady() {
  const [ready, setReady] = useState(false)

  useEffect(() => {
    if (!hasBridge()) return
    return bridgeApi.onRuntimeUpdated(() => setReady(true))
  }, [])

  return ready
}
