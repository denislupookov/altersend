export const JOIN_CODE_PATTERN = /^[a-fA-F0-9]{64}$/

export const JOIN_URL_SCHEME = 'altersend'

export function buildJoinUrl(topic: string): string {
  return `${JOIN_URL_SCHEME}://join/${topic}`
}

export function buildInviteText(topic: string): string {
  return topic
}

export function isValidJoinCode(value: string): boolean {
  return JOIN_CODE_PATTERN.test(value.trim())
}

export function extractJoinCode(value: string): string | null {
  const trimmedValue = value.trim()

  if (!trimmedValue) {
    return null
  }

  const match = trimmedValue.match(/[a-fA-F0-9]{64}/)

  return match ? match[0].toLowerCase() : null
}
