import b4a from 'b4a'
import fs from 'bare-fs'
import crypto from 'hypercore-crypto'

export type DeviceType = 'desktop' | 'laptop' | 'phone' | 'tablet' | 'unknown'

const DEVICE_TYPES: ReadonlySet<DeviceType> = new Set([
  'desktop',
  'laptop',
  'phone',
  'tablet',
  'unknown'
])

export interface DeviceIdentity {
  publicKey: Uint8Array
  secretKey: Uint8Array
  displayName: string
  deviceType: DeviceType
  createdAt: number
}

interface SerializedDeviceIdentity {
  version: 1
  publicKey: string
  secretKey: string
  displayName: string
  deviceType: DeviceType
  createdAt: number
}

const HEX_RE = /^[0-9a-f]+$/i
const PUBLIC_KEY_HEX_LEN = 64
const SECRET_KEY_HEX_LEN = 128

function isHex(value: unknown, expectedLen: number): value is string {
  return typeof value === 'string' && value.length === expectedLen && HEX_RE.test(value)
}

function isSerialized(value: unknown): value is SerializedDeviceIdentity {
  if (!value || typeof value !== 'object') return false
  const v = value as Record<string, unknown>
  return (
    v.version === 1 &&
    isHex(v.publicKey, PUBLIC_KEY_HEX_LEN) &&
    isHex(v.secretKey, SECRET_KEY_HEX_LEN) &&
    typeof v.displayName === 'string' &&
    typeof v.deviceType === 'string' &&
    DEVICE_TYPES.has(v.deviceType as DeviceType) &&
    typeof v.createdAt === 'number' &&
    Number.isFinite(v.createdAt)
  )
}

function serialize(id: DeviceIdentity): SerializedDeviceIdentity {
  return {
    version: 1,
    publicKey: b4a.toString(id.publicKey, 'hex'),
    secretKey: b4a.toString(id.secretKey, 'hex'),
    displayName: id.displayName,
    deviceType: id.deviceType,
    createdAt: id.createdAt
  }
}

function deserialize(s: SerializedDeviceIdentity): DeviceIdentity {
  return {
    publicKey: b4a.from(s.publicKey, 'hex'),
    secretKey: b4a.from(s.secretKey, 'hex'),
    displayName: s.displayName,
    deviceType: s.deviceType,
    createdAt: s.createdAt
  }
}

export interface DeviceIdentityDefaults {
  displayName?: string
  deviceType?: DeviceType
}

export class DeviceIdentityStore {
  private readonly root: string
  private readonly filePath: string
  private readonly defaults: Required<DeviceIdentityDefaults>
  private cache: DeviceIdentity | null = null
  private opQueue: Promise<unknown> = Promise.resolve()
  private dirEnsured: Promise<void> | null = null

  constructor(root: string, defaults: DeviceIdentityDefaults = {}) {
    this.root = root
    this.filePath = `${root}/device.json`
    this.defaults = {
      displayName: defaults.displayName ?? 'AlterSend Device',
      deviceType: defaults.deviceType ?? 'unknown'
    }
  }

  async getOrCreate(): Promise<DeviceIdentity> {
    return this.run(async () => {
      const existing = await this.load()
      if (existing) return existing
      const fresh = this.makeFresh()
      await this.save(fresh)
      return fresh
    })
  }

  async setDisplayName(name: string): Promise<DeviceIdentity> {
    const trimmed = name.trim()
    if (trimmed.length === 0) {
      throw new Error('DeviceIdentityStore: displayName must not be empty')
    }
    return this.run(async () => {
      const current = (await this.load()) ?? this.makeFresh()
      const next: DeviceIdentity = { ...current, displayName: trimmed }
      await this.save(next)
      return next
    })
  }

  async setDeviceType(type: DeviceType): Promise<DeviceIdentity> {
    if (!DEVICE_TYPES.has(type)) {
      throw new Error(`DeviceIdentityStore: unknown deviceType ${type}`)
    }
    return this.run(async () => {
      const current = (await this.load()) ?? this.makeFresh()
      const next: DeviceIdentity = { ...current, deviceType: type }
      await this.save(next)
      return next
    })
  }

  async rotate(): Promise<DeviceIdentity> {
    return this.run(async () => {
      const previous = await this.load()
      const fresh = this.makeFresh({
        displayName: previous?.displayName,
        deviceType: previous?.deviceType
      })
      await this.save(fresh)
      return fresh
    })
  }

  private makeFresh(overrides: Partial<DeviceIdentity> = {}): DeviceIdentity {
    const kp = crypto.keyPair()
    return {
      publicKey: kp.publicKey,
      secretKey: kp.secretKey,
      displayName: overrides.displayName ?? this.defaults.displayName,
      deviceType: overrides.deviceType ?? this.defaults.deviceType,
      createdAt: Date.now()
    }
  }

  private run<T>(fn: () => Promise<T>): Promise<T> {
    const next = this.opQueue.catch(() => undefined).then(fn)
    this.opQueue = next
    return next
  }

  private async load(): Promise<DeviceIdentity | null> {
    if (this.cache) return this.cache
    try {
      const raw = (await fs.promises.readFile(this.filePath, 'utf8')) as string
      const parsed = JSON.parse(raw) as unknown
      if (!isSerialized(parsed)) {
        console.warn('DeviceIdentityStore: identity file shape mismatch — regenerating')
        return null
      }
      this.cache = deserialize(parsed)
      return this.cache
    } catch (err) {
      const code = (err as NodeJS.ErrnoException)?.code
      if (code !== 'ENOENT') {
        console.warn('DeviceIdentityStore: failed to read identity file', err)
      }
      return null
    }
  }

  private async save(id: DeviceIdentity): Promise<void> {
    await this.ensureDir()
    const tmpPath = `${this.filePath}.tmp`
    try {
      await fs.promises.writeFile(tmpPath, JSON.stringify(serialize(id)), 'utf8')
      await fs.promises.rename(tmpPath, this.filePath)
      this.cache = id
    } catch (err) {
      try {
        await fs.promises.unlink(tmpPath)
      } catch {}
      throw err
    }
  }

  private ensureDir(): Promise<void> {
    if (this.dirEnsured) return this.dirEnsured
    const promise = fs.promises.mkdir(this.root, { recursive: true }).catch((err: unknown) => {
      this.dirEnsured = null
      throw err
    })
    this.dirEnsured = promise
    return promise
  }
}
