const KEY = 'altersend.relay.enabled'

export function isRelayEnabled(): boolean {
  try {
    const value = window.localStorage.getItem(KEY)
    return value === null ? true : value === '1'
  } catch {
    return true
  }
}

export function setRelayEnabledStorage(value: boolean): void {
  try {
    window.localStorage.setItem(KEY, value ? '1' : '0')
  } catch {}
}
