import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'
import { describe, expect, it } from 'vitest'

const repoRoot = new URL('../../..', import.meta.url)
const mobileRoot = new URL('apps/mobile', repoRoot)
const allowedRawTextFiles = new Set(['src/components/ThemedText.tsx'])

function walk(dir: string): string[] {
  return readdirSync(dir).flatMap((entry) => {
    const path = join(dir, entry)
    const stat = statSync(path)
    if (stat.isDirectory()) return walk(path)
    return /\.(ts|tsx)$/.test(entry) ? [path] : []
  })
}

describe('mobile font coverage', () => {
  it('routes React Native text through the locale font wrapper', () => {
    const bypasses = walk(mobileRoot.pathname).flatMap((file) => {
      const relativePath = relative(mobileRoot.pathname, file)
      if (allowedRawTextFiles.has(relativePath)) return []

      const source = readFileSync(file, 'utf8')
      const match = source.match(/import\s+\{([^}]+)\}\s+from\s+['"]react-native['"]/)
      if (!match) return []

      const importedNames = match[1].split(',').map((name) => name.trim().split(/\s+as\s+/)[0])
      const rawTextImports = importedNames.filter((name) => name === 'Text' || name === 'TextInput')
      return rawTextImports.length > 0 ? [`${relativePath}: ${rawTextImports.join(', ')}`] : []
    })

    expect(bypasses).toEqual([])
  })
})
