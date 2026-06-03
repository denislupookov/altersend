import { beforeEach, describe, expect, it } from 'vitest'
import { initialSettingsState, settingsStore } from './store'
import { changeLocale } from './commands'

describe('settings store', () => {
  beforeEach(() => {
    settingsStore.setState(initialSettingsState, true)
  })

  it('initializes with a production-ready locale and resolved direction', () => {
    expect(settingsStore.getState().locale).toBe('en')
    expect(settingsStore.getState().isRTL).toBe(false)
  })

  it('changeLocale normalizes an unsupported tag to the default', async () => {
    await changeLocale('de-DE')
    expect(settingsStore.getState().locale).toBe('en')
    expect(settingsStore.getState().isRTL).toBe(false)
  })

  it('changeLocale normalizes a regional English tag to en', async () => {
    await changeLocale('en-US')
    expect(settingsStore.getState().locale).toBe('en')
  })
})
