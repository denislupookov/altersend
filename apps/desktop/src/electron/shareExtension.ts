import { shell } from 'electron'
import { execFile } from 'child_process'
import os from 'os'
import path from 'path'
import { promisify } from 'util'

const run = promisify(execFile)

const SHARE_EXTENSION_BUNDLE_ID = 'com.altersend.desktop.ShareExtension'

const SETTINGS_URL =
  'x-apple.systempreferences:com.apple.ExtensionsPreferences?extensionPointIdentifier=com.apple.share-services'
const QUERY_TIMEOUT_MS = 3000

export function shareContainerDir(): string {
  return path.join(os.homedir(), 'Library', 'Containers', SHARE_EXTENSION_BUNDLE_ID, 'Data')
}

export async function readShareExtensionState(): Promise<ShareExtensionState> {
  if (process.platform !== 'darwin') return 'unknown'

  try {
    const { stdout } = await run('pluginkit', ['-m', '-v', '-i', SHARE_EXTENSION_BUNDLE_ID], {
      timeout: QUERY_TIMEOUT_MS
    })
    const line = stdout.split('\n').find((entry) => entry.includes(SHARE_EXTENSION_BUNDLE_ID))
    if (!line) return 'unknown'
    return line.startsWith('+') ? 'enabled' : 'disabled'
  } catch (err) {
    console.error('shareExtension: could not read registration state', err)
    return 'unknown'
  }
}

export function openShareSettings(): Promise<void> {
  return shell.openExternal(SETTINGS_URL)
}
