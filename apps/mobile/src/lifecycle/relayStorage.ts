import { Directory, File, Paths } from 'expo-file-system'
import {
  formatCustomRelayString,
  parseCustomRelayString,
  type CustomRelayInput,
  type RelayStoragePort
} from '@altersend/domain'

const DIRNAME = 'altersend'
const MARKER_FILENAME = 'relay.disabled'
const CUSTOM_FILENAME = 'relay.custom'

function relayDir(): Directory | null {
  const documentDirectory = Paths.document
  if (!documentDirectory?.uri) return null
  return new Directory(documentDirectory, DIRNAME)
}

function relayFile(name: string): File | null {
  const dir = relayDir()
  return dir ? new File(dir, name) : null
}

function writeRelayFile(name: string, content: string | null): void {
  const dir = relayDir()
  if (!dir) return
  const file = new File(dir, name)
  if (content === null) {
    if (file.exists) file.delete()
    return
  }
  if (!dir.exists) dir.create({ idempotent: true, intermediates: true })
  file.write(content)
}

export function isRelayEnabled(): boolean {
  try {
    return !(relayFile(MARKER_FILENAME)?.exists ?? false)
  } catch {
    return true
  }
}

export function setRelayEnabledStorage(value: boolean): void {
  try {
    writeRelayFile(MARKER_FILENAME, value ? null : '')
  } catch (err) {
    console.warn('relayStorage: setRelayEnabledStorage failed', err)
  }
}

export function getCustomRelay(): CustomRelayInput | null {
  try {
    const file = relayFile(CUSTOM_FILENAME)
    if (!file?.exists) return null
    return parseCustomRelayString(file.textSync())
  } catch {
    return null
  }
}

export function setCustomRelayStorage(value: CustomRelayInput | null): void {
  try {
    writeRelayFile(CUSTOM_FILENAME, value ? formatCustomRelayString(value) : null)
  } catch (err) {
    console.warn('relayStorage: setCustomRelayStorage failed', err)
  }
}

const FALLBACK_FILENAME = 'relay.fallback'

export function getCustomRelayFallback(): boolean {
  try {
    return relayFile(FALLBACK_FILENAME)?.exists ?? false
  } catch {
    return false
  }
}

export function setCustomRelayFallbackStorage(value: boolean): void {
  try {
    writeRelayFile(FALLBACK_FILENAME, value ? '' : null)
  } catch (err) {
    console.warn('relayStorage: setCustomRelayFallbackStorage failed', err)
  }
}

export const relayStoragePort: RelayStoragePort = {
  isEnabled: isRelayEnabled,
  setEnabled: setRelayEnabledStorage,
  readCustom: getCustomRelay,
  writeCustom: setCustomRelayStorage,
  readFallback: getCustomRelayFallback,
  writeFallback: setCustomRelayFallbackStorage
}
