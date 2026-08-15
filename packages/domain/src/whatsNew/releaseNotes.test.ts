import { readFileSync, readdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { RELEASE_NOTES } from './releaseNotes'

const localesRoot = fileURLToPath(new URL('../../../locales/src/locales/', import.meta.url))

function readCatalog(locale: string): Record<string, unknown> {
  return JSON.parse(readFileSync(join(localesRoot, locale, 'common.json'), 'utf8'))
}

function resolve(catalog: Record<string, unknown>, key: string): unknown {
  return key
    .replace(/^common:/, '')
    .split('.')
    .reduce<unknown>(
      (node, part) =>
        node && typeof node === 'object' ? (node as Record<string, unknown>)[part] : undefined,
      catalog
    )
}

describe('release notes', () => {
  it('has translated copy for every highlight in every locale', () => {
    const locales = readdirSync(localesRoot).filter((name) => /^[a-z]{2}-[A-Za-z0-9]+$/.test(name))
    const missing: string[] = []

    for (const locale of locales) {
      const catalog = readCatalog(locale)

      for (const note of RELEASE_NOTES) {
        for (const highlight of note.highlights) {
          for (const key of [highlight.titleKey, highlight.descriptionKey]) {
            if (typeof resolve(catalog, key) !== 'string') missing.push(`${locale}: ${key}`)
          }
        }
      }
    }

    expect(missing).toEqual([])
  })

  it('keeps one entry per version', () => {
    const versions = RELEASE_NOTES.map((note) => note.version)
    expect(versions).toEqual([...new Set(versions)])
  })
})
