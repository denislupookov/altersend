export const ACCOUNT_CODE_LENGTH = 16
const GROUP_SIZE = 4

export const ACCOUNT_CODE_DISPLAY_LENGTH =
  ACCOUNT_CODE_LENGTH + Math.ceil(ACCOUNT_CODE_LENGTH / GROUP_SIZE) - 1

export function normalizeAccountCode(input: string): string {
  return input.replace(/\D/g, '')
}

export function formatAccountCode(code: string): string {
  return (code.match(new RegExp(`.{1,${GROUP_SIZE}}`, 'g')) ?? []).join(' ')
}

export function formatAccountCodeInput(input: string): string {
  return formatAccountCode(normalizeAccountCode(input).slice(0, ACCOUNT_CODE_LENGTH))
}

export function isValidAccountCode(code: string): boolean {
  return code.length === ACCOUNT_CODE_LENGTH && /^\d+$/.test(code)
}

export function isAccountCodeReady(input: string): boolean {
  return isValidAccountCode(normalizeAccountCode(input))
}

export function maskAccountCode(code: string): string {
  const groups = formatAccountCode(code).split(' ')
  return groups.map((group, index) => (index === groups.length - 1 ? group : '••••')).join(' ')
}
