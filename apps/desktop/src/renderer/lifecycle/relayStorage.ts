import {
  formatCustomRelayString,
  parseCustomRelayString,
  type CustomRelayInput,
  type RelayStoragePort
} from '@altersend/domain'

const KEY = 'altersend.relay.enabled'

export function isRelayEnabled(): boolean {
  try {
    const value = window.localStorage.getItem(KEY)
    return value === null ? true : value === '1'
  } catch {
    return true
  }
}

function setRelayEnabledStorage(value: boolean): void {
  try {
    window.localStorage.setItem(KEY, value ? '1' : '0')
  } catch {}
}

const CUSTOM_KEY = 'altersend.relay.custom'

export function getCustomRelay(): CustomRelayInput | null {
  try {
    return parseCustomRelayString(window.localStorage.getItem(CUSTOM_KEY))
  } catch {
    return null
  }
}

function setCustomRelayStorage(value: CustomRelayInput | null): void {
  try {
    if (value) window.localStorage.setItem(CUSTOM_KEY, formatCustomRelayString(value))
    else window.localStorage.removeItem(CUSTOM_KEY)
  } catch {}
}

const FALLBACK_KEY = 'altersend.relay.fallback'

export function getCustomRelayFallback(): boolean {
  try {
    return window.localStorage.getItem(FALLBACK_KEY) === '1'
  } catch {
    return false
  }
}

function setCustomRelayFallbackStorage(value: boolean): void {
  try {
    window.localStorage.setItem(FALLBACK_KEY, value ? '1' : '0')
  } catch {}
}

export const relayStoragePort: RelayStoragePort = {
  isEnabled: isRelayEnabled,
  setEnabled: setRelayEnabledStorage,
  readCustom: getCustomRelay,
  writeCustom: setCustomRelayStorage,
  readFallback: getCustomRelayFallback,
  writeFallback: setCustomRelayFallbackStorage
}
