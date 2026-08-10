import { app, safeStorage } from 'electron'
import { readFile, rm } from 'fs/promises'
import path from 'path'
import { writeFileViaTemp } from './writeFileViaTemp.js'

function storePath(): string {
  return path.join(app.getPath('userData'), 'pro-account')
}

function tokenPath(): string {
  return path.join(app.getPath('userData'), 'pro-token')
}

function sealingAvailable(): boolean {
  return safeStorage.isEncryptionAvailable()
}

const CODE_PATTERN = /^\d{16}$/

export async function readAccountCode(): Promise<string | null> {
  if (!sealingAvailable()) return null

  try {
    const raw = await readFile(storePath())
    const code = safeStorage.decryptString(raw).trim()
    return CODE_PATTERN.test(code) ? code : null
  } catch {
    return null
  }
}

export async function writeAccountCode(code: string): Promise<void> {
  if (!sealingAvailable()) {
    throw new Error('Refusing to store the account code: OS encryption is unavailable')
  }

  await writeFileViaTemp(storePath(), safeStorage.encryptString(code))
}

export async function readAccountToken(): Promise<string | null> {
  if (!sealingAvailable()) return null

  try {
    const raw = await readFile(tokenPath())
    return safeStorage.decryptString(raw).trim() || null
  } catch {
    return null
  }
}

export async function writeAccountToken(token: string | null): Promise<void> {
  if (!token) {
    await rm(tokenPath(), { force: true })
    return
  }

  if (!sealingAvailable()) return

  await writeFileViaTemp(tokenPath(), safeStorage.encryptString(token))
}

export async function clearAccountCode(): Promise<void> {
  await rm(storePath(), { force: true })
  await rm(tokenPath(), { force: true })
}
