import { useCallback, useEffect, useState } from 'react'
import type { ReleaseNote } from './releaseNotes'
import { pickWhatsNewRelease } from './whatsNewModel'

export interface WhatsNewStorage {
  readLastSeen(): string | null
  writeLastSeen(version: string): void
}

export interface WhatsNewOptions {
  version: string
  storage: WhatsNewStorage
  isReturningUser: () => boolean
}

export interface WhatsNewState {
  release: ReleaseNote | null
  dismiss: () => void
}

export function useWhatsNew({ version, storage, isReturningUser }: WhatsNewOptions): WhatsNewState {
  const [release, setRelease] = useState<ReleaseNote | null>(null)

  useEffect(() => {
    const lastSeenVersion = storage.readLastSeen()
    const picked = pickWhatsNewRelease({
      currentVersion: version,
      lastSeenVersion,
      isReturningUser: isReturningUser()
    })

    if (picked) setRelease(picked)
    else if (!lastSeenVersion && version) storage.writeLastSeen(version)
  }, [version, storage, isReturningUser])

  const dismiss = useCallback(() => {
    if (version) storage.writeLastSeen(version)
    setRelease(null)
  }, [version, storage])

  return { release, dismiss }
}
