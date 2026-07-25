import HyperDB, { type HyperDBInstance } from 'hyperdb'
import definition from '../../../schema/spec/hyperdb/index.js'
import { type RememberedPeer, mergeRememberedPeer, isValidRememberedPeer } from './remembered-peer'
import { normalizeKey } from './normalize-key'

const COLLECTION = '@altersend/remembered-peers'

const OPEN_TIMEOUT_MS = 4000

type PeerPatch = Partial<Omit<RememberedPeer, 'remoteDevicePubkey'>>

function withTimeout<T>(promise: Promise<T>, ms: number, message: string): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(message)), ms)
    promise.then(
      (value) => {
        clearTimeout(timer)
        resolve(value)
      },
      (err) => {
        clearTimeout(timer)
        reject(err)
      }
    )
  })
}

export class RememberedPeerStore {
  private readonly dbPath: string
  private db: HyperDBInstance | null = null
  private closed = false
  private degraded = false
  private opQueue: Promise<unknown> = Promise.resolve()

  constructor(root: string) {
    this.dbPath = `${root}/remembered`
  }

  async list(): Promise<RememberedPeer[]> {
    return this.run(async () => {
      const db = await this.ensureOpen()
      if (!db) return []
      const out: RememberedPeer[] = []
      for await (const record of db.find(COLLECTION, {})) {
        if (isValidRememberedPeer(record)) out.push(record)
      }
      return out
    })
  }

  async get(pubkeyHex: string): Promise<RememberedPeer | null> {
    return this.run(async () => {
      const db = await this.ensureOpen()
      if (!db) return null
      const record = await db.get(COLLECTION, {
        remoteDevicePubkey: normalizeKey(pubkeyHex)
      })
      return isValidRememberedPeer(record) ? record : null
    })
  }

  async remember(peer: RememberedPeer): Promise<RememberedPeer> {
    return this.run(async () => {
      const key = normalizeKey(peer.remoteDevicePubkey)
      const db = await this.ensureOpen()
      if (!db) return mergeRememberedPeer(null, { ...peer, remoteDevicePubkey: key })
      const existing = await db.get(COLLECTION, { remoteDevicePubkey: key })
      const merged = mergeRememberedPeer(isValidRememberedPeer(existing) ? existing : null, {
        ...peer,
        remoteDevicePubkey: key
      })
      await db.insert(COLLECTION, merged)
      await db.flush()
      return merged
    })
  }

  async forget(pubkeyHex: string): Promise<void> {
    await this.run(async () => {
      const db = await this.ensureOpen()
      if (!db) return
      await db.delete(COLLECTION, { remoteDevicePubkey: normalizeKey(pubkeyHex) })
      await db.flush()
    })
  }

  async clear(): Promise<void> {
    await this.run(async () => {
      const db = await this.ensureOpen()
      if (!db) return
      const keys: string[] = []
      for await (const record of db.find(COLLECTION, {})) {
        const key = (record as { remoteDevicePubkey?: unknown }).remoteDevicePubkey
        if (typeof key === 'string') keys.push(key)
      }
      for (const remoteDevicePubkey of keys) await db.delete(COLLECTION, { remoteDevicePubkey })
      await db.flush()
    })
  }

  setBlocked(pubkeyHex: string, blocked: boolean): Promise<RememberedPeer | null> {
    return this.patch(pubkeyHex, { blocked })
  }

  rename(pubkeyHex: string, displayName: string): Promise<RememberedPeer | null> {
    const trimmed = displayName.trim()
    if (trimmed.length === 0) {
      throw new Error('RememberedPeerStore: displayName must not be empty')
    }
    return this.patch(pubkeyHex, { displayName: trimmed })
  }

  setMine(pubkeyHex: string, isMine: boolean): Promise<RememberedPeer | null> {
    return this.patch(pubkeyHex, { isMine })
  }

  setAutoAccept(pubkeyHex: string, autoAccept: boolean): Promise<RememberedPeer | null> {
    return this.patch(pubkeyHex, { autoAccept })
  }

  touch(pubkeyHex: string, lastSeenAt: number): Promise<RememberedPeer | null> {
    return this.patch(pubkeyHex, { lastSeenAt })
  }

  async close(): Promise<void> {
    await this.run(async () => {
      this.closed = true
      const db = this.db
      this.db = null
      if (db) await db.close()
    })
  }

  private patch(pubkeyHex: string, patch: PeerPatch): Promise<RememberedPeer | null> {
    return this.run(async () => {
      const db = await this.ensureOpen()
      if (!db) return null
      const existing = await db.get(COLLECTION, { remoteDevicePubkey: normalizeKey(pubkeyHex) })
      if (!isValidRememberedPeer(existing)) return null
      const next = { ...existing, ...patch }
      await db.insert(COLLECTION, next)
      await db.flush()
      return next
    })
  }

  // Returns the open DB, or null when the store is unavailable (e.g. its lock is
  // held by another worklet). Callers degrade to a non-persistent path on null so
  // a locked store can never wedge the worklet.
  private async ensureOpen(): Promise<HyperDBInstance | null> {
    if (this.closed) throw new Error('RememberedPeerStore: store is closed')
    if (this.degraded) return null
    if (this.db) return this.db
    const db = HyperDB.rocks(this.dbPath, definition)
    try {
      // A read forces the RocksDB engine to open and acquire the file lock, so a
      // contended lock surfaces here (bounded) rather than on every later op.
      await withTimeout(
        db.get(COLLECTION, { remoteDevicePubkey: '00' }),
        OPEN_TIMEOUT_MS,
        'RememberedPeerStore: open timed out (store locked by another instance?)'
      )
      this.db = db
      return db
    } catch (err) {
      this.degraded = true
      // Tear down the half-opened engine so its late lock rejection doesn't dangle.
      try {
        void Promise.resolve(db.close()).catch(() => {})
      } catch {}
      console.warn(
        'RememberedPeerStore: remembered store unavailable; continuing without persistence',
        err
      )
      return null
    }
  }

  private run<T>(fn: () => Promise<T>): Promise<T> {
    const next = this.opQueue.catch(() => undefined).then(fn)
    this.opQueue = next
    return next
  }
}
