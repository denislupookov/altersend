import { describe, expect, it } from 'vitest'
import { RESOURCES, SUPPORTED_LOCALES } from './index'

type JsonRecord = Record<string, unknown>

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
        expect(flattenKeys(localeResources[namespace]).sort(), `${locale.code}/${namespace}`)
          .toEqual(flattenKeys(source[namespace]).sort())
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

  it('includes plural keys for file counts in every locale', () => {
    for (const locale of SUPPORTED_LOCALES) {
      expect(RESOURCES[locale.code].common.files.count_one, locale.code).toBeTruthy()
      expect(RESOURCES[locale.code].common.files.count_other, locale.code).toBeTruthy()
      expect(RESOURCES[locale.code].receive.summary.receivedCount_one, locale.code).toBeTruthy()
      expect(RESOURCES[locale.code].receive.summary.receivedCount_other, locale.code).toBeTruthy()
      expect(RESOURCES[locale.code].send.actions.sendFiles_one, locale.code).toBeTruthy()
      expect(RESOURCES[locale.code].send.actions.sendFiles_other, locale.code).toBeTruthy()
    }
  })
})
