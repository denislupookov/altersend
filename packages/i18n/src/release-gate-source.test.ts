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
})
