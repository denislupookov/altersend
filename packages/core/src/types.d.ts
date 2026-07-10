declare function setTimeout(callback: () => void, ms: number): unknown
declare function clearTimeout(handle: unknown): void

declare module 'hypercore-crypto' {
  export function randomBytes(n: number): Buffer
  export function discoveryKey(topic: Uint8Array): Uint8Array
  export function keyPair(seed?: Uint8Array): { publicKey: Uint8Array; secretKey: Uint8Array }
  export function hash(data: Uint8Array | Uint8Array[], out?: Uint8Array): Uint8Array
  export function sign(message: Uint8Array, secretKey: Uint8Array): Uint8Array
  export function verify(message: Uint8Array, signature: Uint8Array, publicKey: Uint8Array): boolean

  const _default: {
    randomBytes: typeof randomBytes
    discoveryKey: typeof discoveryKey
    keyPair: typeof keyPair
    hash: typeof hash
    sign: typeof sign
    verify: typeof verify
  }
  export default _default
}

declare module 'hyperdb' {
  export interface HyperDBInstance {
    insert(collection: string, record: unknown): Promise<void>
    get(collection: string, key: Record<string, string>): Promise<Record<string, unknown> | null>
    delete(collection: string, key: Record<string, string>): Promise<void>
    find(
      collection: string,
      query?: Record<string, unknown>
    ): AsyncIterable<Record<string, unknown>>
    flush(): Promise<void>
    close(): Promise<void>
  }
  const HyperDB: {
    rocks(path: string, definition: unknown): HyperDBInstance
    bee(core: unknown, definition: unknown): HyperDBInstance
  }
  export default HyperDB
}

declare module 'corestore' {
  export default class Corestore {
    constructor(storage: string)
    namespace(name: string): Corestore
    replicate(socket: unknown, opts?: { live?: boolean }): unknown
    close(): Promise<void>
  }
}

declare module 'hyperdrive' {
  import Corestore from 'corestore'

  export interface HyperdriveBlobInfo {
    byteLength: number
  }
  export interface HyperdriveEntry {
    value?: { blob?: HyperdriveBlobInfo } | null
  }
  export interface HyperdriveDownload {
    done(): Promise<void>
    destroy(): void
  }

  export default class Hyperdrive {
    constructor(corestore: Corestore, key?: Uint8Array)
    ready(): Promise<void>
    readonly writable: boolean
    readonly key: Uint8Array
    readonly core?: { writable: boolean }
    entry(path: string): Promise<HyperdriveEntry | null>
    update(opts?: { wait?: boolean }): Promise<void>
    close(): Promise<void>
    download(path: string): HyperdriveDownload
    // Returns a Readable (not just a ReadableStream) so callers can destroy() on abort.
    createReadStream(path: string): import('stream').Readable
  }
}

declare module 'localdrive' {
  export interface LocaldriveBlobInfo {
    byteLength: number
  }
  export interface LocaldriveEntry {
    value?: { blob?: LocaldriveBlobInfo } | null
  }

  export default class Localdrive {
    constructor(dir: string)
    ready(): Promise<void>
    entry(path: string): Promise<LocaldriveEntry | null>
    close(): Promise<void>
    createWriteStream(path: string): import('stream').Writable
  }
}

declare module 'mirror-drive' {
  interface DriveLike {
    entry(path: string): Promise<unknown>
  }
  export default class MirrorDrive {
    constructor(source: DriveLike, dest: DriveLike, opts?: { entries?: string[]; prune?: boolean })
    done(): Promise<void>
  }
}

declare module 'hyperswarm' {
  import { EventEmitter } from 'events'

  export interface NoiseKeyPair {
    publicKey: Uint8Array
    secretKey: Uint8Array
  }
  export interface PeerInfo {
    publicKey: Uint8Array
  }
  export interface PeerSocket {
    handshakeHash: Uint8Array | null
    on(event: 'close', cb: () => void): this
    on(event: 'error', cb: (err: Error) => void): this
    destroy(err?: Error): void
  }
  export interface SwarmDiscoverySession {
    flushed(): Promise<void>
  }

  export default class Hyperswarm extends EventEmitter {
    constructor(opts?: {
      keyPair?: NoiseKeyPair
      firewall?: (remotePublicKey: Uint8Array) => boolean
      relayThrough?: ((force: boolean, swarm: unknown) => Uint8Array[] | null) | Uint8Array[] | null
    })
    join(
      discoveryKey: Uint8Array,
      opts?: { server?: boolean; client?: boolean }
    ): SwarmDiscoverySession
    leave(discoveryKey: Uint8Array): unknown
    destroy(): Promise<void>
    on(event: 'connection', cb: (socket: PeerSocket, info: PeerInfo) => void): this
    on(event: 'update', cb: () => void): this
  }
}

declare module 'hyperdht' {
  export interface MutableRecord {
    seq: number
    value: Uint8Array
    signature: Uint8Array
  }
  export default class HyperDHT {
    mutableGet(
      publicKey: Uint8Array,
      opts?: { latest?: boolean; seq?: number }
    ): Promise<MutableRecord | null>
    destroy(): Promise<void>
  }
}

declare module 'protomux' {
  export interface ProtomuxMessage<T = unknown> {
    send(message: T): void
  }
  export interface ProtomuxChannel {
    addMessage<T = unknown>(opts: {
      encoding: unknown
      onmessage: (message: T) => void
    }): ProtomuxMessage<T>
    open(): void
  }
  export default class Protomux {
    static from(socket: unknown): Protomux
    createChannel(opts: {
      protocol: string
      onopen?: () => void
      onclose?: () => void
    }): ProtomuxChannel | null
  }
}

declare module 'compact-encoding' {
  export const json: unknown
  const _default: { json: typeof json }
  export default _default
}

declare module 'bare-process' {
  type ProcessEvent = 'beforeExit' | 'SIGTERM' | 'SIGINT' | 'suspend' | 'resume'
  const process: {
    on(event: ProcessEvent, handler: (...args: unknown[]) => void): void
  }
  export default process
}

declare module 'bare-fs' {
  interface RmOptions {
    recursive?: boolean
    force?: boolean
  }
  interface MkdirOptions {
    recursive?: boolean
  }

  export function rmSync(path: string, opts?: RmOptions): void
  export function readFileSync(path: string, encoding: BufferEncoding): string
  export function mkdirSync(path: string, opts?: MkdirOptions): void
  export function writeFileSync(path: string, data: string, encoding: BufferEncoding): void
  export function renameSync(from: string, to: string): void
  export function unlinkSync(path: string): void

  export const promises: {
    rm(path: string, opts?: RmOptions): Promise<void>
    unlink(path: string): Promise<void>
    readFile(path: string, encoding: BufferEncoding): Promise<string>
    writeFile(path: string, data: string, encoding: BufferEncoding): Promise<void>
    rename(from: string, to: string): Promise<void>
    mkdir(path: string, opts?: MkdirOptions): Promise<void>
  }

  const _default: {
    rmSync: typeof rmSync
    readFileSync: typeof readFileSync
    mkdirSync: typeof mkdirSync
    writeFileSync: typeof writeFileSync
    renameSync: typeof renameSync
    unlinkSync: typeof unlinkSync
    promises: typeof promises
  }
  export default _default
}

declare module 'bare-rpc' {
  export interface RPCRequest {
    readonly command: number
    readonly data: Uint8Array
    reply(data: string | Uint8Array): void
  }
  export interface RPCMessage {
    send(data: string | Uint8Array): void
  }
  export interface RPCRequestHandle extends RPCMessage {
    reply(): Promise<Uint8Array>
  }

  export default class RPC {
    constructor(stream: unknown, onmessage: (req: RPCRequest) => void | Promise<void>)
    event(command: number): RPCMessage
    request(command: number): RPCRequestHandle
  }
}

// Bare runtime globals exposed in worklet contexts only.
interface BareGlobal {
  IPC: unknown
  argv: string[]
}
declare var Bare: BareGlobal
declare var Pear: unknown
