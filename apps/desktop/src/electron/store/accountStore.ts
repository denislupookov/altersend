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

function sealed(): boolean {
  return app.isPackaged
}

function readSecret(raw: Buffer): string {
  return sealed() ? safeStorage.decryptString(raw) : raw.toString('utf8')
}

function writeSecret(value: string): Buffer {
  if (!sealed()) return Buffer.from(value, 'utf8')

  if (!safeStorage.isEncryptionAvailable()) {
    throw new Error('Refusing to store the account code: OS encryption is unavailable')
  }

  return safeStorage.encryptString(value)
}

const CODE_PATTERN = /^\d{16}$/

export async function readAccountCode(): Promise<string | null> {
  try {
    const code = readSecret(await readFile(storePath())).trim()
    return CODE_PATTERN.test(code) ? code : null
  } catch {
    return null
  }
}

export async function writeAccountCode(code: string): Promise<void> {
  await writeFileViaTemp(storePath(), writeSecret(code))
}

export async function readAccountToken(): Promise<string | null> {
  try {
    return readSecret(await readFile(tokenPath())).trim() || null
  } catch {
    return null
  }
}

export async function writeAccountToken(token: string | null): Promise<void> {
  if (!token) {
    await rm(tokenPath(), { force: true })
    return
  }

  await writeFileViaTemp(tokenPath(), writeSecret(token))
}

export async function clearAccountCode(): Promise<void> {
  await rm(storePath(), { force: true })
  await rm(tokenPath(), { force: true })
}
