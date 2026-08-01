import type { FileOffer } from './transfer/peerProtocol'

export type Translate = (key: string, options?: Record<string, unknown>) => string

export type ConnectionPhase = 'idle' | 'connecting' | 'connected' | 'disconnected'

type FileStatus = 'idle' | 'downloading' | 'paused' | 'completed' | 'failed'

export interface TransferFile {
  offer: FileOffer
  received: number
  status: FileStatus
}
