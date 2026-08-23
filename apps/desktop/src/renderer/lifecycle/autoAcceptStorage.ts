import type { AutoAcceptStoragePort } from '@altersend/domain'

const KEY = 'altersend.devices.autoAccept'

function isAutoAcceptEnabled(): boolean {
  try {
    return window.localStorage.getItem(KEY) === '1'
  } catch {
    return false
  }
}

function setAutoAcceptEnabled(enabled: boolean): void {
  try {
    window.localStorage.setItem(KEY, enabled ? '1' : '0')
  } catch {}
}

export const autoAcceptStoragePort: AutoAcceptStoragePort = {
  read: isAutoAcceptEnabled,
  write: setAutoAcceptEnabled
}
