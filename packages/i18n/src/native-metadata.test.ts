import { createRequire } from 'node:module'
import { existsSync, mkdtempSync, readFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { DEFAULT_LOCALE, isMultiLangEnabled, RESOURCES, SUPPORTED_LOCALES } from './index'

const repoRoot = new URL('../../..', import.meta.url)
const require = createRequire(import.meta.url)

const desktopLocaleDirs = {
  'en-US': 'en.lproj',
  'en-GB': 'en_GB.lproj',
  'ja-JP': 'ja.lproj',
  'ko-KR': 'ko.lproj',
  'zh-CN': 'zh-Hans.lproj',
  'zh-TW': 'zh-Hant.lproj',
  'fr-FR': 'fr.lproj',
  'de-DE': 'de.lproj',
  'it-IT': 'it.lproj',
  'pt-BR': 'pt-BR.lproj',
  'es-419': 'es-419.lproj',
  'es-ES': 'es.lproj'
} as const

function readJson(path: URL) {
  return JSON.parse(readFileSync(path, 'utf8')) as Record<string, unknown>
}

describe('native metadata localization', () => {
  it('declares Expo locale metadata for every supported locale', () => {
    const appJson = readJson(new URL('apps/mobile/app.json', repoRoot))
    const expo = appJson.expo as {
      ios: { infoPlist: Record<string, unknown> }
      locales: Record<string, string>
    }

    expect(expo.ios.infoPlist.CFBundleAllowMixedLocalizations).toBe(true)

    for (const locale of SUPPORTED_LOCALES) {
      const localePath = expo.locales[locale.code]
      expect(localePath, locale.code).toBe(`./locales/${locale.code}.json`)

      const metadata = readJson(new URL(`apps/mobile/locales/${locale.code}.json`, repoRoot)) as {
        ios: Record<string, string>
        android: Record<string, string>
      }
      const permissions = RESOURCES[locale.code].native.permissions

      expect(metadata.ios.CFBundleDisplayName, locale.code).toBe('AlterSend')
      expect(metadata.ios.NSCameraUsageDescription, locale.code).toBe(permissions.camera)
      expect(metadata.ios.NSLocalNetworkUsageDescription, locale.code).toBe(
        permissions.localNetwork
      )
      expect(metadata.ios.NSPhotoLibraryUsageDescription, locale.code).toBe(permissions.photoRead)
      expect(metadata.ios.NSPhotoLibraryAddUsageDescription, locale.code).toBe(
        permissions.photoSave
      )
      expect(metadata.android.app_name, locale.code).toBe('AlterSend')
    }
  })

  it('ships macOS InfoPlist localizations for every supported locale', () => {
    for (const locale of SUPPORTED_LOCALES) {
      const dir = desktopLocaleDirs[locale.code]
      const file = new URL(`apps/desktop/build/locales/${dir}/InfoPlist.strings`, repoRoot)
      expect(existsSync(file), locale.code).toBe(true)

      const content = readFileSync(file, 'utf8')
      expect(content, locale.code).toContain('"CFBundleDisplayName" = "AlterSend";')
      expect(content, locale.code).toContain(
        `"NSCameraUsageDescription" = "${RESOURCES[locale.code].native.permissions.camera}";`
      )
    }
  })

  it('keeps generated Expo native locale metadata English-only while release-gated', () => {
    const createExpoConfig = require('../../../apps/mobile/app.config.cjs') as (args: {
      config: Record<string, unknown>
    }) => Record<string, unknown> | { expo: Record<string, unknown> }

    const generatedConfig = createExpoConfig({ config: {} })
    const generated =
      'expo' in generatedConfig
        ? (generatedConfig.expo as Record<string, unknown>)
        : (generatedConfig as Record<string, unknown>)

    if (isMultiLangEnabled) {
      expect(Object.keys((generated.locales as Record<string, string>) ?? {}).sort()).toEqual(
        SUPPORTED_LOCALES.map((locale) => locale.code).sort()
      )
      return
    }

    expect(Object.keys((generated.locales as Record<string, string>) ?? {})).toEqual([
      DEFAULT_LOCALE
    ])

    const plugins = generated.plugins as unknown[]
    const localizationPlugin = plugins.find(
      (plugin): plugin is [string, { supportedLocales: { ios: string[]; android: string[] } }] =>
        Array.isArray(plugin) && plugin[0] === 'expo-localization'
    )

    expect(localizationPlugin?.[1].supportedLocales.ios).toEqual([DEFAULT_LOCALE])
    expect(localizationPlugin?.[1].supportedLocales.android).toEqual([DEFAULT_LOCALE])
  })

  it('does not copy non-English macOS native localizations while release-gated', async () => {
    const afterPack = require('../../../apps/desktop/scripts/afterPack.cjs') as {
      default: (context: unknown) => Promise<void>
    }
    const tmp = mkdtempSync(join(tmpdir(), 'altersend-afterpack-'))

    try {
      await afterPack.default({
        electronPlatformName: 'darwin',
        arch: 3,
        appOutDir: tmp,
        packager: {
          appInfo: {
            productFilename: 'AlterSend'
          }
        }
      })

      const resourcesDir = join(tmp, 'AlterSend.app', 'Contents', 'Resources')
      expect(existsSync(join(resourcesDir, 'en.lproj', 'InfoPlist.strings'))).toBe(true)

      if (!isMultiLangEnabled) {
        expect(existsSync(join(resourcesDir, 'ja.lproj', 'InfoPlist.strings'))).toBe(false)
        expect(existsSync(join(resourcesDir, 'ko.lproj', 'InfoPlist.strings'))).toBe(false)
      }
    } finally {
      rmSync(tmp, { recursive: true, force: true })
    }
  })
})
