import type { FileOffer, TextOffer } from './peerProtocol'

export const CONNECT_ERROR_CODES = ['relayUnreachable', 'senderNotFound', 'nothingShared'] as const

export type ConnectErrorCode = (typeof CONNECT_ERROR_CODES)[number]

type ConnectStage = 'relay' | 'finding' | 'waiting' | 'preparing'

export interface ConnectHandlers {
  onStatus?: (stage: ConnectStage) => void
  onClosed?: () => void
  onLimit?: (maxTransferBytes: number | null) => void
}

export interface DownloadHandlers {
  onProgress?: (received: number, total: number) => void
  onDone?: (savedAs: string, size: number, file: File | null) => void
  onError?: (message: string) => void
}

export interface Connection {
  offers: FileOffer[]
  texts: TextOffer[]
  maxTransferBytes?: number | null
  download: (offer: FileOffer, handlers: DownloadHandlers, toOpfs: boolean) => Promise<void>
  close: () => void
}

export interface Peer {
  publicKey: Uint8Array
}

export interface RelayDHT {
  ready(): Promise<void>
  destroy?(): Promise<void>
  lookup(discovery: Uint8Array): {
    on(event: 'data', cb: (res: { peers?: Peer[] }) => void): void
    on(event: 'close' | 'error', cb: () => void): void
  }
  connect(publicKey: Uint8Array): {
    on(event: 'open' | 'close', cb: () => void): void
    on(event: 'error', cb: (err: Error) => void): void
  }
}
