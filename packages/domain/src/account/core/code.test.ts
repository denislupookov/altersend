import { describe, expect, it } from 'vitest'
import {
  ACCOUNT_CODE_DISPLAY_LENGTH,
  ACCOUNT_CODE_LENGTH,
  formatAccountCode,
  formatAccountCodeInput,
  isAccountCodeReady,
  isValidAccountCode,
  maskAccountCode,
  normalizeAccountCode
} from './code'

const CODE = '0239011197318834'

describe('account code', () => {
  it('is sixteen digits', () => {
    expect(ACCOUNT_CODE_LENGTH).toBe(16)
    expect(isValidAccountCode(CODE)).toBe(true)
  })

  it('rejects the wrong length', () => {
    expect(isValidAccountCode(CODE.slice(0, 15))).toBe(false)
    expect(isValidAccountCode(`${CODE}1`)).toBe(false)
  })

  it('rejects anything that is not a digit', () => {
    expect(isValidAccountCode('023901119731883A')).toBe(false)
  })

  it('strips formatting so a pasted code still works', () => {
    expect(normalizeAccountCode('0239 0111 9731 8834')).toBe(CODE)
    expect(normalizeAccountCode('0239-0111-9731-8834')).toBe(CODE)
    expect(normalizeAccountCode('  0239 0111 9731 8834  ')).toBe(CODE)
  })

  it('groups the code for display', () => {
    expect(formatAccountCode(CODE)).toBe('0239 0111 9731 8834')
  })

  it('round trips through display form', () => {
    expect(normalizeAccountCode(formatAccountCode(CODE))).toBe(CODE)
  })

  it('hides every group but the last', () => {
    expect(maskAccountCode(CODE)).toBe('•••• •••• •••• 8834')
  })

  it('groups typed input as it grows', () => {
    expect(formatAccountCodeInput('0')).toBe('0')
    expect(formatAccountCodeInput('0239')).toBe('0239')
    expect(formatAccountCodeInput('02390')).toBe('0239 0')
  })

  it('drops anything that is not a digit while typing', () => {
    expect(formatAccountCodeInput('02a39-b0111')).toBe('0239 0111')
  })

  it('is ready only once the display form holds a full code', () => {
    expect(isAccountCodeReady('0239 0111 9731 883')).toBe(false)
    expect(isAccountCodeReady('0239 0111 9731 8834')).toBe(true)
  })

  it('stops at the full code length', () => {
    expect(formatAccountCodeInput(`${CODE}9999`)).toBe('0239 0111 9731 8834')
    expect(ACCOUNT_CODE_DISPLAY_LENGTH).toBe(19)
    expect(formatAccountCode(CODE)).toHaveLength(ACCOUNT_CODE_DISPLAY_LENGTH)
  })
})
