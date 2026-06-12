const JOIN_CODE_PATTERN = /^[a-fA-F0-9]{64}$/

export function isValidJoinCode(value: string): boolean {
  return JOIN_CODE_PATTERN.test(value.trim())
}

export function extractJoinCode(value: string | undefined): string | null {
  if (!value) return null
  const trimmedValue = value.trim()

  if (!trimmedValue) {
    return null
  }

  const match = trimmedValue.match(/[a-fA-F0-9]{64}/)

  return match ? match[0].toLowerCase() : null
}