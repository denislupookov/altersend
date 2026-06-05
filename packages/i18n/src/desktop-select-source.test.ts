import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

const selectSource = readFileSync(
  new URL('../../../apps/desktop/src/renderer/components/Select.tsx', import.meta.url),
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

  it('closes the popup before notifying consumers about a selected option', () => {
    const chooseOptionIndex = selectSource.indexOf('const chooseOption')
    const closeIndex = selectSource.indexOf('setOpen(false)', chooseOptionIndex)
    const onChangeIndex = selectSource.indexOf('onChange(option.value)', chooseOptionIndex)

    expect(chooseOptionIndex).toBeGreaterThanOrEqual(0)
    expect(closeIndex).toBeGreaterThan(chooseOptionIndex)
    expect(onChangeIndex).toBeGreaterThan(closeIndex)
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
    expect(selectSource).toContain('fontFamily?: string')
    expect(selectSource).toContain(
      'style={option.fontFamily ? { fontFamily: option.fontFamily } : undefined}'
    )
    expect(footerBarSource).toContain('getLocaleFontFamily')
    expect(footerBarSource).toContain('getFontFamilyCssVariables')
    expect(footerBarSource).toContain('fontFamily: getLocaleOptionFontFamily(option)')
  })
})
