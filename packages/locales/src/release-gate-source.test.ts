import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

const repoRoot = new URL('../../..', import.meta.url)
const desktopRoot = new URL('apps/desktop', repoRoot)
const mobileRoot = new URL('apps/mobile', repoRoot)

function readDesktop(path: string): string {
  return readFileSync(join(desktopRoot.pathname, path), 'utf8')
}

function readMobile(path: string): string {
  return readFileSync(join(mobileRoot.pathname, path), 'utf8')
}

function readMobilePackageJson() {
  return JSON.parse(readMobile('package.json')) as {
    scripts: Record<string, string>
  }
}

describe('release-gated language UI wiring', () => {
  it('forces desktop locale initialization through the active locale resolver', () => {
    const source = readDesktop('src/renderer/main.tsx')

    expect(source).toContain('resolveActiveLocalePreference')
    expect(source).not.toContain('initI18n(resolveLocalePreference(')
  })

  it('hides the desktop language selector behind the multi-language flag', () => {
    const source = readDesktop('src/renderer/pages/TransferPage/FooterBar.tsx')

    expect(source).toContain('isMultiLangEnabled')
    expect(source).toMatch(/\{isMultiLangEnabled && \(/)
  })

  it('forces mobile locale initialization through the active locale resolver', () => {
    const source = readMobile('app/_layout.tsx')

    expect(source).toContain('resolveActiveLocalePreference')
    expect(source).not.toContain('initI18n(resolveLocalePreference(')
  })

  it('hides and guards the mobile language picker behind the multi-language flag', () => {
    const settingsSource = readMobile('app/settings.tsx')
    const languageSource = readMobile('app/language.tsx')

    expect(settingsSource).toContain('isMultiLangEnabled')
    expect(settingsSource).toMatch(/\{isMultiLangEnabled && \(/)
    expect(languageSource).toContain('isMultiLangEnabled')
    expect(languageSource).toMatch(/if \(!isMultiLangEnabled\)/)
  })

  it('builds shared packages before direct mobile dev commands can start Metro', () => {
    const { scripts } = readMobilePackageJson()

    expect(scripts['build:packages']).toBeDefined()
    expect(scripts['build:packages']).toContain('npm run build -w packages/locales')
    expect(scripts.prestart).toMatch(/build:packages.*bundle-bare/)
    expect(scripts.preandroid).toMatch(/build:packages.*bundle:android/)
    expect(scripts.preios).toMatch(/build:packages.*bundle:ios/)
  })

  it('routes mobile Metro workspace packages to source files', () => {
    const metroSource = readMobile('metro.config.js')

    expect(metroSource).toContain('workspaceSourceAliases')
    expect(metroSource).toContain("'@altersend/locales'")
    expect(metroSource).toContain('packages/locales/src/index.ts')
    expect(metroSource).toContain("'@altersend/components'")
    expect(metroSource).toContain('packages/components/src/index.ts')
    expect(metroSource).toContain('resolveRequest')
  })
})
