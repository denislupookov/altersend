import b4a from 'b4a'
import fs from 'bare-fs'
import crypto from 'hypercore-crypto'
import { DEVICE_TYPES, type DeviceType } from './device-type'

export type { DeviceType }

export interface DeviceIdentity {
  publicKey: Uint8Array
  secretKey: Uint8Array
  displayName: string
  deviceType: DeviceType
  createdAt: number
}

interface SerializedMeta {
  version: 2
  publicKey: string
  displayName: string
  deviceType: DeviceType
  createdAt: number
}

interface SerializedLegacy {
  version: 1
  publicKey: string
  secretKey: string
  displayName: string
  deviceType: DeviceType
  createdAt: number
}

export type DeviceSecretInit = { mode: 'managed'; secret: string | null } | { mode: 'legacy' }

type DeviceMeta = Omit<SerializedMeta, 'version'>

const HEX_RE = /^[0-9a-f]+$/i
const PUBLIC_KEY_HEX_LEN = 64
const SECRET_KEY_HEX_LEN = 128

function isHex(value: unknown, expectedLen: number): value is string {
  return typeof value === 'string' && value.length === expectedLen && HEX_RE.test(value)
}

function hasCommonMeta(v: Record<string, unknown>): boolean {
  return (
    isHex(v.publicKey, PUBLIC_KEY_HEX_LEN) &&
    typeof v.displayName === 'string' &&
    typeof v.deviceType === 'string' &&
    DEVICE_TYPES.has(v.deviceType as DeviceType) &&
    typeof v.createdAt === 'number' &&
    Number.isFinite(v.createdAt)
  )
}

function isMeta(value: unknown): value is SerializedMeta {
  if (!value || typeof value !== 'object') return false
  const v = value as Record<string, unknown>
  return v.version === 2 && hasCommonMeta(v)
}

function isLegacy(value: unknown): value is SerializedLegacy {
  if (!value || typeof value !== 'object') return false
  const v = value as Record<string, unknown>
  return v.version === 1 && isHex(v.secretKey, SECRET_KEY_HEX_LEN) && hasCommonMeta(v)
}

function deviceFromSecret(
  secretKey: Uint8Array,
  meta: Omit<DeviceMeta, 'publicKey'>
): DeviceIdentity {
  return {
    publicKey: b4a.from(secretKey.subarray(32, 64)),
    secretKey,
    displayName: meta.displayName,
    deviceType: meta.deviceType,
    createdAt: meta.createdAt
  }
}

export interface DeviceIdentityDefaults {
  displayName?: string
  deviceType?: DeviceType
}

function createDeferred<T>() {
  let resolve!: (value: T) => void
  const promise = new Promise<T>((res) => {
    resolve = res
  })
  return { promise, resolve }
}

type LoadedFile =
  | { kind: 'meta'; meta: DeviceMeta }
  | { kind: 'legacy'; meta: DeviceMeta; identity: DeviceIdentity }
  | null

export class DeviceIdentityStore {
  private readonly root: string
  private readonly filePath: string
  private readonly defaults: Required<DeviceIdentityDefaults>
  private cache: DeviceIdentity | null = null
  private opQueue: Promise<unknown> = Promise.resolve()
  private dirEnsured: Promise<void> | null = null

  private readonly injected = createDeferred<DeviceSecretInit>()
  private secretToSeal: string | null = null

  constructor(root: string, defaults: DeviceIdentityDefaults = {}) {
    this.root = root
    this.filePath = `${root}/device.json`
    this.defaults = {
      displayName: defaults.displayName ?? 'Unknown Device',
      deviceType: defaults.deviceType ?? 'unknown'
    }
  }

  async provideSecret(init: DeviceSecretInit): Promise<string | null> {
    this.injected.resolve(init)
    await this.getOrCreate()
    const seal = this.secretToSeal
    this.secretToSeal = null
    return seal
  }

  async getOrCreate(): Promise<DeviceIdentity> {
    return this.run(async () => {
      if (this.cache) return this.cache
      const init = await this.injected.promise
      this.cache = await this.materialize(init)
      return this.cache
    })
  }

  private async materialize(init: DeviceSecretInit): Promise<DeviceIdentity> {
    const stored = await this.loadFile()

    if (init.mode === 'legacy') {
      if (stored?.kind === 'legacy') return stored.identity
      if (stored?.kind === 'meta') {
        console.warn('DeviceIdentityStore: legacy mode but secret is keychain-only — regenerating')
      }
      const fresh = this.makeFresh()
      await this.saveLegacy(fresh)
      return fresh
    }

    if (init.secret) {
      if (isHex(init.secret, SECRET_KEY_HEX_LEN)) {
        const secretKey = b4a.from(init.secret, 'hex')
        const id = deviceFromSecret(secretKey, stored?.meta ?? this.freshMeta())
        if (stored?.kind !== 'meta') await this.saveMeta(id)
        return id
      }
      console.warn(
        'DeviceIdentityStore: injected secret is malformed — recovering from disk or regenerating'
      )
    }

    if (stored?.kind === 'legacy') {
      this.secretToSeal = b4a.toString(stored.identity.secretKey, 'hex')
      await this.saveMeta(stored.identity)
      return stored.identity
    }
    const fresh = this.makeFresh()
    this.secretToSeal = b4a.toString(fresh.secretKey, 'hex')
    await this.saveMeta(fresh)
    return fresh
  }

  private freshMeta(): Omit<DeviceMeta, 'publicKey'> {
    return {
      displayName: this.defaults.displayName,
      deviceType: this.defaults.deviceType,
      createdAt: Date.now()
    }
  }

  private makeFresh(): DeviceIdentity {
    const kp = crypto.keyPair()
    return {
      publicKey: kp.publicKey,
      secretKey: kp.secretKey,
      ...this.freshMeta()
    }
  }

  private run<T>(fn: () => Promise<T>): Promise<T> {
    const next = this.opQueue.catch(() => undefined).then(fn)
    this.opQueue = next
    return next
  }

  private async loadFile(): Promise<LoadedFile> {
    try {
      const raw = (await fs.promises.readFile(this.filePath, 'utf8')) as string
      const parsed = JSON.parse(raw) as unknown
      if (isMeta(parsed)) {
        const { publicKey, displayName, deviceType, createdAt } = parsed
        return { kind: 'meta', meta: { publicKey, displayName, deviceType, createdAt } }
      }
      if (isLegacy(parsed)) {
        const { publicKey, secretKey, displayName, deviceType, createdAt } = parsed
        const sk = b4a.from(secretKey, 'hex')
        return {
          kind: 'legacy',
          meta: { publicKey, displayName, deviceType, createdAt },
          identity: deviceFromSecret(sk, { displayName, deviceType, createdAt })
        }
      }
      console.warn('DeviceIdentityStore: identity file shape mismatch — regenerating')
      return null
    } catch (err) {
      const code = (err as NodeJS.ErrnoException)?.code
      if (code !== 'ENOENT') {
        console.warn('DeviceIdentityStore: failed to read identity file', err)
      }
      return null
    }
  }

  private saveMeta(id: DeviceIdentity): Promise<void> {
    return this.writeFile({
      version: 2,
      publicKey: b4a.toString(id.publicKey, 'hex'),
      displayName: id.displayName,
      deviceType: id.deviceType,
      createdAt: id.createdAt
    } satisfies SerializedMeta)
  }

  private saveLegacy(id: DeviceIdentity): Promise<void> {
    return this.writeFile({
      version: 1,
      publicKey: b4a.toString(id.publicKey, 'hex'),
      secretKey: b4a.toString(id.secretKey, 'hex'),
      displayName: id.displayName,
      deviceType: id.deviceType,
      createdAt: id.createdAt
    } satisfies SerializedLegacy)
  }

  private async writeFile(payload: SerializedMeta | SerializedLegacy): Promise<void> {
    await this.ensureDir()
    const tmpPath = `${this.filePath}.tmp`
    try {
      await fs.promises.writeFile(tmpPath, JSON.stringify(payload), 'utf8')
      await fs.promises.rename(tmpPath, this.filePath)
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
