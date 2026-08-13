import { isValidHexKey, type CustomRelayInput } from '@altersend/core'

export type { CustomRelayInput }

const ORG_PREFIX = 'org:'
const RELAY_PREFIX = 'relay:'

function parseOrgCode(body: string): CustomRelayInput | null {
  if (!isValidHexKey(body)) return null
  return { kind: 'org', keyHex: body }
}

function parseRelayCode(body: string): CustomRelayInput | null {
  const separator = body.lastIndexOf('@')
  if (separator < 0) return null

  const keyHex = body.slice(0, separator)
  const host = body.slice(separator + 1)

  if (!isValidHexKey(keyHex)) return null
  if (host.length === 0 || /\s/.test(host)) return null

  return { kind: 'relay', keyHex, host }
}

export function parseCustomRelayString(input: string | null | undefined): CustomRelayInput | null {
  const code = (input ?? '').trim().toLowerCase()

  if (code.startsWith(ORG_PREFIX)) return parseOrgCode(code.slice(ORG_PREFIX.length))
  if (code.startsWith(RELAY_PREFIX)) return parseRelayCode(code.slice(RELAY_PREFIX.length))

  return null
}

export function formatCustomRelayString(config: CustomRelayInput): string {
  if (config.kind === 'relay') return `relay:${config.keyHex}@${config.host}`
  return `org:${config.keyHex}`
}
