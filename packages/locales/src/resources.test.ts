import { describe, expect, it } from 'vitest'
import { RESOURCES, SUPPORTED_LOCALES } from './index'

type JsonRecord = Record<string, unknown>
type StringEntry = { path: string; value: string }

function flattenKeys(value: unknown, prefix = ''): string[] {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return prefix ? [prefix] : []
  }
  return Object.entries(value as JsonRecord).flatMap(([key, child]) =>
    flattenKeys(child, prefix ? `${prefix}.${key}` : key)
  )
}

function collectStrings(value: unknown): string[] {
  if (typeof value === 'string') return [value]
  if (!value || typeof value !== 'object' || Array.isArray(value)) return []
  return Object.values(value as JsonRecord).flatMap((child) => collectStrings(child))
}

function flattenStringEntries(value: unknown, prefix = ''): StringEntry[] {
  if (typeof value === 'string') return prefix ? [{ path: prefix, value }] : []
  if (!value || typeof value !== 'object' || Array.isArray(value)) return []

  return Object.entries(value as JsonRecord).flatMap(([key, child]) =>
    flattenStringEntries(child, prefix ? `${prefix}.${key}` : key)
  )
}

function isPlaceholderOnly(value: string): boolean {
  const withoutPlaceholders = value.replace(/\{\{[^}]+\}\}/g, '')
  const withoutPunctuation = withoutPlaceholders.replace(/[\s%.,:;!?()[\]{}'"“”‘’…·\-+/#|]+/g, '')
  return withoutPunctuation.length === 0
}

const identicalValueAllowList = new Set([
  'AlterSend',
  'Discord',
  'General',
  'GitHub',
  'GitHub Issues',
  'QR',
  'OK'
])

const identicalKeyAllowList = new Set([
  'common.files.count_one',
  'common.files.text',
  'common.files.items_one',
  'common.labels.desktop',
  'settings.rows.feedback',
  'feedback.title'
])

function canMatchEnglishSource(key: string, value: string): boolean {
  return (
    identicalValueAllowList.has(value.trim()) ||
    identicalKeyAllowList.has(key) ||
    isPlaceholderOnly(value)
  )
}

describe('translation resources', () => {
  it('has resources for every supported locale', () => {
    expect(Object.keys(RESOURCES).sort()).toEqual(
      SUPPORTED_LOCALES.map((locale) => locale.code).sort()
    )
  })

  it('keeps every locale namespace and key aligned with en-US', () => {
    const source = RESOURCES['en-US']
    const expectedNamespaces = Object.keys(source).sort() as Array<keyof typeof source>

    for (const locale of SUPPORTED_LOCALES) {
      const localeResources = RESOURCES[locale.code]
      expect(Object.keys(localeResources).sort(), locale.code).toEqual(expectedNamespaces)

      for (const namespace of expectedNamespaces) {
        expect(
          flattenKeys(localeResources[namespace]).sort(),
          `${locale.code}/${namespace}`
        ).toEqual(flattenKeys(source[namespace]).sort())
      }
    }
  })

  it('does not ship empty translated strings', () => {
    for (const locale of SUPPORTED_LOCALES) {
      const localeResources = RESOURCES[locale.code]
      const namespaces = Object.keys(localeResources) as Array<keyof typeof localeResources>
      for (const namespace of namespaces) {
        const emptyStrings = collectStrings(localeResources[namespace]).filter(
          (value) => value.trim().length === 0
        )
        expect(emptyStrings, `${locale.code}/${namespace}`).toEqual([])
      }
    }
  })

  it('does not leave en-US strings in non-English locales', () => {
    const source = RESOURCES['en-US']
    const namespaces = Object.keys(source) as Array<keyof typeof source>
    const checkedLocales = SUPPORTED_LOCALES.filter(
      (locale) => locale.code !== 'en-US' && locale.code !== 'en-GB'
    )

    for (const locale of checkedLocales) {
      const identicalEntries: string[] = []

      for (const namespace of namespaces) {
        const sourceByPath = new Map(
          flattenStringEntries(source[namespace]).map((entry) => [entry.path, entry.value])
        )

        for (const entry of flattenStringEntries(RESOURCES[locale.code][namespace])) {
          const sourceValue = sourceByPath.get(entry.path)
          const key = `${String(namespace)}.${entry.path}`
          if (
            sourceValue &&
            entry.value === sourceValue &&
            !canMatchEnglishSource(key, sourceValue)
          ) {
            identicalEntries.push(`${key}: ${entry.value}`)
          }
        }
      }

      expect(identicalEntries, locale.code).toEqual([])
    }
  })

  it('includes plural keys for file counts in every locale', () => {
    for (const locale of SUPPORTED_LOCALES) {
      expect(RESOURCES[locale.code].common.files.count_one, locale.code).toBeTruthy()
      expect(RESOURCES[locale.code].common.files.count_other, locale.code).toBeTruthy()
      expect(
        RESOURCES[locale.code].receive.page.incomingTransfer.description_one,
        locale.code
      ).toBeTruthy()
      expect(
        RESOURCES[locale.code].receive.page.incomingTransfer.description_other,
        locale.code
      ).toBeTruthy()
      expect(RESOURCES[locale.code].receive.summary.receivedCount_one, locale.code).toBeTruthy()
      expect(RESOURCES[locale.code].receive.summary.receivedCount_other, locale.code).toBeTruthy()
      expect(RESOURCES[locale.code].receive.summary.filesSaved_one, locale.code).toBeTruthy()
      expect(RESOURCES[locale.code].receive.summary.filesSaved_other, locale.code).toBeTruthy()
      expect(RESOURCES[locale.code].send.actions.sendFiles_one, locale.code).toBeTruthy()
      expect(RESOURCES[locale.code].send.actions.sendFiles_other, locale.code).toBeTruthy()
      expect(RESOURCES[locale.code].send.preparing.uploadedCount_one, locale.code).toBeTruthy()
      expect(RESOURCES[locale.code].send.preparing.uploadedCount_other, locale.code).toBeTruthy()
    }
  })
})
