import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

const desktopPackageJson = JSON.parse(
  readFileSync(new URL('../../../apps/desktop/package.json', import.meta.url), 'utf8')
) as {
  scripts: Record<string, string>
}
const selectSource = readFileSync(
  new URL('../../../apps/desktop/src/renderer/components/Select.tsx', import.meta.url),
  'utf8'
)
const selectBehaviorSource = readFileSync(
  new URL('../../../apps/desktop/src/renderer/components/selectBehavior.ts', import.meta.url),
  'utf8'
)
const desktopMainSource = readFileSync(
  new URL('../../../apps/desktop/src/renderer/main.tsx', import.meta.url),
  'utf8'
)
const desktopIndexCssSource = readFileSync(
  new URL('../../../apps/desktop/src/renderer/index.css', import.meta.url),
  'utf8'
)
const footerBarSource = readFileSync(
  new URL('../../../apps/desktop/src/renderer/pages/TransferPage/FooterBar.tsx', import.meta.url),
  'utf8'
)

describe('desktop Select implementation', () => {
  it('uses an app-controlled listbox instead of the native select popup', () => {
    expect(selectSource).not.toContain('<select')
    expect(selectSource).toContain("role='listbox'")
    expect(selectSource).toContain("role='option'")
  })

  it('keeps locale font synchronization inside the shared ThemeProvider', () => {
    expect(desktopMainSource).not.toContain('getFontFamilyCssVariables')
    expect(desktopMainSource).not.toContain('fontVariables')
    expect(desktopMainSource).not.toContain('<div style={fontVariables}>')
  })

  it('forces plain form controls to inherit the locale font', () => {
    expect(desktopIndexCssSource).toMatch(
      /button,\s*\n\s*input,\s*\n\s*select,\s*\n\s*textarea\s*\{\s*\n\s*font: inherit;\s*\n\s*\}/
    )
  })

  it('supports per-option fonts for multilingual language names', () => {
    expect(selectBehaviorSource).toContain('fontFamily?: string')
    expect(selectSource).toContain(
      'style={option.fontFamily ? { fontFamily: option.fontFamily } : undefined}'
    )
    expect(footerBarSource).toContain('getLocaleFontFamily')
    expect(footerBarSource).toContain('getFontFamilyCssVariables')
    expect(footerBarSource).toContain('fontFamily: getLocaleOptionFontFamily(option)')
  })

  it('keeps the desktop build script portable across Windows and Unix shells', () => {
    expect(desktopPackageJson.scripts.build).not.toMatch(/\bcp\b/)
    expect(desktopPackageJson.scripts.build).toContain('node scripts/copy-preload.cjs')

    const copyScript = readFileSync(
      new URL('../../../apps/desktop/scripts/copy-preload.cjs', import.meta.url),
      'utf8'
    )
    expect(copyScript).toContain('copyFileSync')
    expect(copyScript).toContain('mkdirSync')
  })
})
