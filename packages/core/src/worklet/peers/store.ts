import fs from 'bare-fs'
import {
  type RememberedPeer,
  findPeer,
  mergeRememberedPeer,
  patchPeer,
  removePeer,
  sanitizeRememberedPeers,
  upsertPeer
} from './remembered-peer'

interface RememberedFile {
  version: 1
  peers: RememberedPeer[]
}

type PeerPatch = Partial<Omit<RememberedPeer, 'remoteDevicePubkey'>>

export class RememberedPeerStore {
  private readonly root: string
  private readonly filePath: string
  private cache: RememberedPeer[] | null = null
  private opQueue: Promise<unknown> = Promise.resolve()
  private dirEnsured: Promise<void> | null = null

  constructor(root: string) {
    this.root = root
    this.filePath = `${root}/remembered.json`
  }

  async list(): Promise<RememberedPeer[]> {
    return this.run(async () => [...(await this.load())])
  }

  async get(pubkeyHex: string): Promise<RememberedPeer | null> {
    return this.run(async () => findPeer(await this.load(), pubkeyHex))
  }

  async remember(peer: RememberedPeer): Promise<RememberedPeer> {
    return this.run(async () => {
      const peers = await this.load()
      const merged = mergeRememberedPeer(findPeer(peers, peer.remoteDevicePubkey), peer)
      await this.save(upsertPeer(peers, merged))
      return merged
    })
  }

  async forget(pubkeyHex: string): Promise<void> {
    await this.run(async () => {
      const peers = await this.load()
      const next = removePeer(peers, pubkeyHex)
      if (next.length !== peers.length) await this.save(next)
    })
  }

  async clear(): Promise<void> {
    await this.run(async () => {
      await this.save([])
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

  private patch(pubkeyHex: string, patch: PeerPatch): Promise<RememberedPeer | null> {
    return this.run(async () => {
      const peers = await this.load()
      const next = patchPeer(peers, pubkeyHex, patch)
      if (next === peers) return null
      await this.save(next)
      return findPeer(next, pubkeyHex)
    })
  }

  private run<T>(fn: () => Promise<T>): Promise<T> {
    const next = this.opQueue.catch(() => undefined).then(fn)
    this.opQueue = next
    return next
  }

  private async load(): Promise<RememberedPeer[]> {
    if (this.cache) return this.cache
    try {
      const raw = (await fs.promises.readFile(this.filePath, 'utf8')) as string
      const parsed = JSON.parse(raw) as { version?: unknown; peers?: unknown }
      if (parsed?.version === 1) {
        this.cache = sanitizeRememberedPeers(parsed.peers)
        return this.cache
      }
      console.warn('RememberedPeerStore: file shape mismatch — starting fresh')
    } catch (err) {
      const code = (err as NodeJS.ErrnoException)?.code
      if (code !== 'ENOENT') {
        console.warn('RememberedPeerStore: failed to read peers file', err)
      }
    }
    this.cache = []
    return this.cache
  }

  private async save(peers: RememberedPeer[]): Promise<void> {
    await this.ensureDir()
    const file: RememberedFile = { version: 1, peers }
    const tmpPath = `${this.filePath}.tmp`
    try {
      await fs.promises.writeFile(tmpPath, JSON.stringify(file), 'utf8')
      await fs.promises.rename(tmpPath, this.filePath)
      this.cache = peers
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
