import type { WhatsNewStorage } from '@altersend/domain'

const KEY = 'altersend.whatsNew.lastSeenVersion'

function getLastSeenRelease(): string | null {
  try {
    return window.localStorage.getItem(KEY)
  } catch {
    return null
  }
}

function markReleaseSeen(version: string): void {
  try {
    window.localStorage.setItem(KEY, version)
  } catch {}
}

export const whatsNewStorage: WhatsNewStorage = {
  readLastSeen: getLastSeenRelease,
  writeLastSeen: markReleaseSeen
}
