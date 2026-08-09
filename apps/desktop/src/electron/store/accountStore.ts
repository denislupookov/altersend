import { app, safeStorage } from 'electron'
import { readFile, rm } from 'fs/promises'
import path from 'path'
import { writeFileViaTemp } from './writeFileViaTemp.js'

function storePath(): string {
  return path.join(app.getPath('userData'), 'pro-account')
}

function sealingAvailable(): boolean {
  return app.isPackaged && safeStorage.isEncryptionAvailable()
}

export async function readAccountCode(): Promise<string | null> {
  try {
    const raw = await readFile(storePath())
    const code = sealingAvailable() ? safeStorage.decryptString(raw) : raw.toString('utf8')
    return code.trim() || null
  } catch {
    return null
  }
}

export async function writeAccountCode(code: string): Promise<void> {
  const payload = sealingAvailable() ? safeStorage.encryptString(code) : Buffer.from(code, 'utf8')
  await writeFileViaTemp(storePath(), payload)
}

export async function clearAccountCode(): Promise<void> {
  await rm(storePath(), { force: true })
}
