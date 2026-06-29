import HyperDB, { type HyperDBInstance } from 'hyperdb'
import definition from '../../../schema/spec/hyperdb/index.js'
import { type RememberedPeer, mergeRememberedPeer, isValidRememberedPeer } from './remembered-peer'

const COLLECTION = '@altersend/remembered-peers'

type PeerPatch = Partial<Omit<RememberedPeer, 'remoteDevicePubkey'>>

const normalizeKey = (pubkeyHex: string): string => pubkeyHex.toLowerCase()

export class RememberedPeerStore {
  private readonly dbPath: string
  private db: HyperDBInstance | null = null
  private closed = false
  private opQueue: Promise<unknown> = Promise.resolve()

  constructor(root: string) {
    this.dbPath = `${root}/remembered`
  }

  async list(): Promise<RememberedPeer[]> {
    return this.run(async () => {
      const out: RememberedPeer[] = []
      for await (const record of this.open().find(COLLECTION, {})) {
        if (isValidRememberedPeer(record)) out.push(record)
      }
      return out
    })
  }

  async get(pubkeyHex: string): Promise<RememberedPeer | null> {
    return this.run(async () => {
      const record = await this.open().get(COLLECTION, {
        remoteDevicePubkey: normalizeKey(pubkeyHex)
      })
      return isValidRememberedPeer(record) ? record : null
    })
  }

  async remember(peer: RememberedPeer): Promise<RememberedPeer> {
    return this.run(async () => {
      const db = this.open()
      const key = normalizeKey(peer.remoteDevicePubkey)
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
      const db = this.open()
      await db.delete(COLLECTION, { remoteDevicePubkey: normalizeKey(pubkeyHex) })
      await db.flush()
    })
  }

  async clear(): Promise<void> {
    await this.run(async () => {
      const db = this.open()
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
      const db = this.open()
      const existing = await db.get(COLLECTION, { remoteDevicePubkey: normalizeKey(pubkeyHex) })
      if (!isValidRememberedPeer(existing)) return null
      const next = { ...existing, ...patch }
      await db.insert(COLLECTION, next)
      await db.flush()
      return next
    })
  }

  private open(): HyperDBInstance {
    if (this.closed) throw new Error('RememberedPeerStore: store is closed')
    if (!this.db) this.db = HyperDB.rocks(this.dbPath, definition)
    return this.db
  }

  private run<T>(fn: () => Promise<T>): Promise<T> {
    const next = this.opQueue.catch(() => undefined).then(fn)
    this.opQueue = next
    return next
  }
}
