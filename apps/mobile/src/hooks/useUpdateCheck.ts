import Constants from 'expo-constants'
import { Directory, File, Paths } from 'expo-file-system'
import { useCallback, useEffect, useState } from 'react'

const CACHE_DIR = 'altersend'
const CACHE_FILE = 'update-check.json'
const CACHE_TTL_MS = 24 * 60 * 60 * 1000
const FETCH_TIMEOUT_MS = 10_000
const GITHUB_RELEASES_URL = 'https://api.github.com/repos/denislupookov/altersend/releases/latest'

interface CacheEntry {
  version: string
  fetchedAt: number
  dismissedVersion?: string
}

function parseParts(version: string): number[] {
  return version
    .replace(/[^0-9.]/g, '')
    .split('.')
    .map(Number)
}

function isNewer(current: string, latest: string): boolean {
  const cur = parseParts(current)
  const lat = parseParts(latest)
  for (let i = 0; i < Math.max(cur.length, lat.length); i++) {
    if ((lat[i] ?? 0) > (cur[i] ?? 0)) return true
    if ((lat[i] ?? 0) < (cur[i] ?? 0)) return false
  }
  return false
}

function getCacheFile(): File | null {
  const base = Paths.document
  if (!base?.uri) return null
  return new File(new Directory(base, CACHE_DIR), CACHE_FILE)
}

function isCacheStale(entry: CacheEntry): boolean {
  return Date.now() - entry.fetchedAt > CACHE_TTL_MS
}

function readCache(): CacheEntry | null {
  try {
    const file = getCacheFile()
    if (!file?.exists) return null
    const data = JSON.parse(file.textSync())
    if (typeof data.version === 'string' && typeof data.fetchedAt === 'number') return data
    return null
  } catch {
    return null
  }
}

function writeCache(entry: CacheEntry): void {
  try {
    const base = Paths.document
    if (!base?.uri) return
    const dir = new Directory(base, CACHE_DIR)
    if (!dir.exists) dir.create({ idempotent: true, intermediates: true })
    new File(dir, CACHE_FILE).write(JSON.stringify(entry))
  } catch {}
}

async function fetchLatestRelease(): Promise<CacheEntry | null> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS)
  try {
    const res = await fetch(GITHUB_RELEASES_URL, {
      headers: { 'User-Agent': 'AlterSend' },
      signal: controller.signal
    })
    if (!res.ok) return null

    const json = await res.json()
    const isStableRelease = !json.draft && !json.prerelease
    const tag: string = json.tag_name ?? ''
    const isValidTag = /^v?\d+\.\d+/.test(tag)

    if (!isStableRelease || !isValidTag) return null

    return { version: tag.replace(/^v/, ''), fetchedAt: Date.now() }
  } catch {
    return null
  } finally {
    clearTimeout(timer)
  }
}

export function useUpdateCheck(): { needsUpdate: boolean; dismiss: () => void } {
  const [entry, setEntry] = useState<CacheEntry | null>(null)

  useEffect(() => {
    let cancelled = false

    async function check() {
      const current = Constants.expoConfig?.version
      if (!current) return

      let cached = readCache()
      if (!cached || isCacheStale(cached)) {
        const fetched = await fetchLatestRelease()
        if (fetched) {
          const next = { ...fetched, dismissedVersion: cached?.dismissedVersion }
          writeCache(next)
          cached = next
        }
      }

      if (!cancelled && cached) setEntry(cached)
    }

    const timer = setTimeout(check, 1000)
    return () => {
      cancelled = true
      clearTimeout(timer)
    }
  }, [])

  const dismiss = useCallback(() => {
    if (!entry) return
    const updated = { ...entry, dismissedVersion: entry.version }
    writeCache(updated)
    setEntry(updated)
  }, [entry])

  const current = Constants.expoConfig?.version ?? ''
  const needsUpdate =
    !!current &&
    !!entry &&
    entry.dismissedVersion !== entry.version &&
    isNewer(current, entry.version)

  return { needsUpdate, dismiss }
}
