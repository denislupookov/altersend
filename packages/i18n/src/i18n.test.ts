import { describe, expect, it } from 'vitest'
import { changeI18nLanguage, i18nextInstance, initI18n } from './i18n'

describe.sequential('i18n runtime', () => {
  it('initializes and switches languages', async () => {
    await initI18n('en-US')
    expect(i18nextInstance.language).toBe('en-US')
    expect(i18nextInstance.t('common:labels.language')).toBe('Language')

    await changeI18nLanguage('ja-JP')
    expect(i18nextInstance.language).toBe('ja-JP')
    expect(i18nextInstance.t('common:labels.language')).toBe('言語')

    await changeI18nLanguage('en-GB')
    expect(i18nextInstance.language).toBe('en-GB')
    expect(i18nextInstance.t('common:labels.language')).toBe('Language')
  })

  it('resolves pluralized copy through i18next count rules', async () => {
    await initI18n('en-US')

    expect(i18nextInstance.t('common:files.count', { count: 1 })).toBe('1 file')
    expect(i18nextInstance.t('common:files.count', { count: 2 })).toBe('2 files')
    expect(i18nextInstance.t('send:actions.sendFiles', { count: 1 })).toBe('Send 1 file')
    expect(i18nextInstance.t('send:actions.sendFiles', { count: 2 })).toBe('Send 2 files')
  })
})
