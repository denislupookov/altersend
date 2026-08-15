import { compareVersions, isNewerVersion } from '../version'
import {
  RELEASE_NOTES,
  type ReleaseHighlight,
  type ReleaseNote,
  type ReleasePlatform
} from './releaseNotes'

export interface WhatsNewInput {
  currentVersion: string
  lastSeenVersion: string | null
  isReturningUser: boolean
}

const notesNewestFirst = [...RELEASE_NOTES].sort((a, b) => compareVersions(b.version, a.version))

function shippedReleaseNote(currentVersion: string): ReleaseNote | null {
  if (!currentVersion) return null
  return notesNewestFirst.find((note) => !isNewerVersion(note.version, currentVersion)) ?? null
}

export function pickWhatsNewRelease({
  currentVersion,
  lastSeenVersion,
  isReturningUser
}: WhatsNewInput): ReleaseNote | null {
  if (!lastSeenVersion && !isReturningUser) return null

  const shipped = shippedReleaseNote(currentVersion)
  if (!shipped) return null
  if (!lastSeenVersion) return shipped

  return isNewerVersion(shipped.version, lastSeenVersion) ? shipped : null
}

export function highlightsForPlatform(
  note: ReleaseNote,
  platform: ReleasePlatform
): ReleaseHighlight[] {
  return note.highlights.filter(
    (highlight) => !highlight.platforms || highlight.platforms.includes(platform)
  )
}
