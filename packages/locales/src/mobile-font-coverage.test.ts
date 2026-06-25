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

  it('refreshes the Settings language row from saved preference on focus', () => {
    const settingsSource = readFileSync(join(mobileRoot.pathname, 'app/settings.tsx'), 'utf8')
    const storageSource = readFileSync(
      join(mobileRoot.pathname, 'src/lifecycle/localePreferenceStorage.ts'),
      'utf8'
    )

    expect(settingsSource).toContain('useFocusEffect')
    expect(settingsSource).toContain('getSavedLocalePreference')
    expect(settingsSource).toContain('getLocalePreferenceSnapshot')
    expect(settingsSource).toContain('subscribeLocalePreference')
    expect(settingsSource).toMatch(
      /useState<LocalePreference>\(\s*getLocalePreferenceSnapshot\s*\)/
    )
    expect(settingsSource).toMatch(/subscribeLocalePreference\(setLocalePreference\)/)
    expect(settingsSource).toMatch(/useFocusEffect\(\s*useCallback\(\(\) => \{/s)
    expect(storageSource).toContain('export function getLocalePreferenceSnapshot')
    expect(storageSource).toContain('export function subscribeLocalePreference')
    expect(storageSource).toMatch(/listeners\.forEach\(\(listener\) => listener\(preference\)\)/)
  })

  it('keeps shared row text metrics explicit for CJK fonts', () => {
    const settingsSource = readFileSync(join(mobileRoot.pathname, 'app/settings.tsx'), 'utf8')
    const linkRowSource = readFileSync(
      join(repoRoot.pathname, 'packages/components/src/components/LinkRow/styles.ts'),
      'utf8'
    )

    expect(linkRowSource).toMatch(
      /label:\s*\{[^}]*fontSize:\s*tokens\.fontSizeBase,[^}]*lineHeight:\s*tokens\.lineHeightSnug/s
    )
    expect(linkRowSource).toMatch(
      /subtitle:\s*\{[^}]*fontSize:\s*tokens\.fontSizeSm,[^}]*lineHeight:\s*tokens\.lineHeightNormal/s
    )
    expect(settingsSource).toMatch(/brandName:\s*\{[^}]*fontSize:\s*13,[^}]*lineHeight:\s*18/s)
    expect(settingsSource).toMatch(/brandTagline:\s*\{[^}]*fontSize:\s*12,[^}]*lineHeight:\s*16/s)
  })

  it('returns from the language screen before changing the active i18n language', () => {
    const languageSource = readFileSync(join(mobileRoot.pathname, 'app/language.tsx'), 'utf8')

    expect(languageSource).toMatch(/const handleSelect = async \(value: string\) => \{/)
    expect(languageSource).toContain('function scheduleLanguageChange')
    expect(languageSource).toContain('requestIdleCallback')
    expect(languageSource).not.toContain('InteractionManager')
    expect(languageSource.indexOf('router.back()')).toBeLessThan(
      languageSource.indexOf('changeI18nLanguage(resolvedLocale)')
    )
  })

  it('renders language picker options with per-locale fonts', () => {
    const languageSource = readFileSync(join(mobileRoot.pathname, 'app/language.tsx'), 'utf8')

    expect(languageSource).toContain('getNativeFontFamilyName')
    expect(languageSource).toContain('getLocaleFontFamily')
    expect(languageSource).toContain('getOptionNativeNameFontFamily')
    expect(languageSource).toContain('fontFamily: getOptionNativeNameFontFamily(option)')
    expect(languageSource).not.toContain('BUNDLED_FONT_FAMILIES.latin.cssFamily')
  })

  it('keeps language picker row text metrics explicit for CJK option fonts', () => {
    const languageSource = readFileSync(join(mobileRoot.pathname, 'app/language.tsx'), 'utf8')

    expect(languageSource).toMatch(/label:\s*\{[^}]*fontSize:\s*15,[^}]*lineHeight:\s*20/s)
    expect(languageSource).toMatch(/hint:\s*\{[^}]*fontSize:\s*12,[^}]*lineHeight:\s*16/s)
    expect(languageSource).toMatch(/label:\s*\{[^}]*includeFontPadding:\s*false/s)
    expect(languageSource).toMatch(/hint:\s*\{[^}]*includeFontPadding:\s*false/s)
    expect(languageSource).not.toMatch(/label:\s*\{[^}]*fontWeight:\s*'500'/s)
  })

  it('does not send translated back titles to Android native stack headers', () => {
    const layoutSource = readFileSync(join(mobileRoot.pathname, 'app/_layout.tsx'), 'utf8')
    const flowOptionsMatch = layoutSource.match(/function getFlowScreenOptions\([\s\S]*?\n\}/)?.[0]

    expect(layoutSource).toContain('import { Platform')
    expect(flowOptionsMatch).toBeDefined()
    expect(flowOptionsMatch).toContain("Platform.OS === 'ios'")
    expect(flowOptionsMatch).toContain('headerBackTitle: backTitle')
  })

  it('registers CJK font weights through Expo and the runtime font loader', () => {
    const appJson = JSON.parse(readFileSync(join(mobileRoot.pathname, 'app.json'), 'utf8')) as {
      expo: { plugins: unknown[] }
    }
    const fontLoaderSource = readFileSync(
      join(mobileRoot.pathname, 'src/theme/useAlterSendFonts.ts'),
      'utf8'
    )

    const expoFontPlugin = appJson.expo.plugins.find(
      (plugin) => Array.isArray(plugin) && plugin[0] === 'expo-font'
    )

    expect(expoFontPlugin).toBeDefined()
    expect(JSON.stringify(expoFontPlugin)).toContain('NotoSans-JP-Regular.ttf')
    expect(JSON.stringify(expoFontPlugin)).toContain('NotoSans-JP-Bold.ttf')
    expect(JSON.stringify(expoFontPlugin)).toContain('NotoSans-KR-Regular.ttf')
    expect(JSON.stringify(expoFontPlugin)).toContain('NotoSans-KR-Bold.ttf')
    expect(JSON.stringify(expoFontPlugin)).toContain('NotoSans-SC-Regular.ttf')
    expect(JSON.stringify(expoFontPlugin)).toContain('NotoSans-SC-Bold.ttf')
    expect(JSON.stringify(expoFontPlugin)).toContain('NotoSans-TC-Regular.ttf')
    expect(JSON.stringify(expoFontPlugin)).toContain('NotoSans-TC-Bold.ttf')
    expect(fontLoaderSource).toContain('NotoSans-JP-Regular.ttf')
    expect(fontLoaderSource).toContain('NotoSans-JP-Bold.ttf')
    expect(fontLoaderSource).toContain('NotoSans-KR-Regular.ttf')
    expect(fontLoaderSource).toContain('NotoSans-KR-Bold.ttf')
    expect(fontLoaderSource).toContain('NotoSans-SC-Regular.ttf')
    expect(fontLoaderSource).toContain('NotoSans-SC-Bold.ttf')
    expect(fontLoaderSource).toContain('NotoSans-TC-Regular.ttf')
    expect(fontLoaderSource).toContain('NotoSans-TC-Bold.ttf')
  })
})
