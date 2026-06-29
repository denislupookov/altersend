import { describe, it, expect, beforeEach, vi } from 'vitest'

const { files } = vi.hoisted(() => ({ files: new Map<string, string>() }))

vi.mock('bare-fs', () => {
  const enoent = () => Object.assign(new Error('ENOENT'), { code: 'ENOENT' })
  return {
    default: {
      promises: {
        readFile: async (p: string) => {
          if (!files.has(p)) throw enoent()
          return files.get(p)!
        },
        writeFile: async (p: string, data: string) => {
          files.set(p, data)
        },
        rename: async (from: string, to: string) => {
          if (!files.has(from)) throw enoent()
          files.set(to, files.get(from)!)
          files.delete(from)
        },
        unlink: async (p: string) => {
          files.delete(p)
        },
        mkdir: async () => {}
      }
    }
  }
})

import b4a from 'b4a'
import crypto from 'hypercore-crypto'
import { DeviceIdentityStore } from './device-identity-store'

const ROOT = '/identity'
const FILE = `${ROOT}/device.json`

const readFile = () => JSON.parse(files.get(FILE) as string)

beforeEach(() => files.clear())

describe('DeviceIdentityStore', () => {
  it('managed/fresh: generates a key, hands it back to seal, writes a secret-free v2 file', async () => {
    const store = new DeviceIdentityStore(ROOT)
    const sealed = await store.provideSecret({ mode: 'managed', secret: null })

    expect(sealed).toMatch(/^[0-9a-f]{128}$/)
    const file = readFile()
    expect(file.version).toBe(2)
    expect(file.secretKey).toBeUndefined()

    const id = await store.getOrCreate()
    expect(b4a.toString(id.publicKey, 'hex')).toBe(file.publicKey)
  })

  it('managed/injected: reuses the host-supplied secret and seals nothing', async () => {
    const kp = crypto.keyPair()
    const secretHex = b4a.toString(kp.secretKey, 'hex')

    const store = new DeviceIdentityStore(ROOT)
    const sealed = await store.provideSecret({ mode: 'managed', secret: secretHex })

    expect(sealed).toBeNull()
    const id = await store.getOrCreate()
    expect(b4a.toString(id.secretKey, 'hex')).toBe(secretHex)
    expect(b4a.toString(id.publicKey, 'hex')).toBe(b4a.toString(kp.publicKey, 'hex'))
    expect(readFile().secretKey).toBeUndefined()
  })

  it('migrates a legacy v1 file: seals the old secret, keeps the identity, strips the secret from disk', async () => {
    const kp = crypto.keyPair()
    const legacy = {
      version: 1,
      publicKey: b4a.toString(kp.publicKey, 'hex'),
      secretKey: b4a.toString(kp.secretKey, 'hex'),
      displayName: 'Old Device',
      deviceType: 'laptop',
      createdAt: 123
    }
    files.set(FILE, JSON.stringify(legacy))

    const store = new DeviceIdentityStore(ROOT)
    const sealed = await store.provideSecret({ mode: 'managed', secret: null })

    expect(sealed).toBe(legacy.secretKey)
    const file = readFile()
    expect(file.version).toBe(2)
    expect(file.secretKey).toBeUndefined()
    expect(file.publicKey).toBe(legacy.publicKey)
    expect(file.displayName).toBe('Old Device')
  })

  it('managed/malformed secret: ignores it and regenerates a key to seal', async () => {
    const store = new DeviceIdentityStore(ROOT)
    const sealed = await store.provideSecret({ mode: 'managed', secret: 'not-a-valid-secret' })

    expect(sealed).toMatch(/^[0-9a-f]{128}$/)
    const file = readFile()
    expect(file.version).toBe(2)
    expect(file.secretKey).toBeUndefined()
  })

  it('legacy mode: keeps the secret in the file when no keychain is available', async () => {
    const store = new DeviceIdentityStore(ROOT)
    const sealed = await store.provideSecret({ mode: 'legacy' })

    expect(sealed).toBeNull()
    const file = readFile()
    expect(file.version).toBe(1)
    expect(file.secretKey).toMatch(/^[0-9a-f]{128}$/)
  })
})
