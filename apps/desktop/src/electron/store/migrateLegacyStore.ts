import fs from 'fs'
import path from 'path'

const STORE_ENTRIES = ['app-storage', 'identity', 'pear-runtime']

export function migrateLegacyStore(legacyDir: string, dir: string): void {
  if (legacyDir === dir || !fs.existsSync(legacyDir)) return

  try {
    fs.mkdirSync(dir, { recursive: true })
  } catch (err) {
    console.warn('[runtime] store migration failed to create target:', err)
    return
  }

  for (const entry of STORE_ENTRIES) {
    const from = path.join(legacyDir, entry)
    if (!fs.existsSync(from)) continue

    const to = fs.existsSync(path.join(dir, entry))
      ? path.join(legacyDir, `legacy-${entry}`)
      : path.join(dir, entry)
    if (fs.existsSync(to)) continue

    try {
      fs.renameSync(from, to)
    } catch (err) {
      console.warn(`[runtime] store migration failed for ${entry}:`, err)
    }
  }
}
