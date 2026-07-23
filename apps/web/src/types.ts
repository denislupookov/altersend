import type { FileOffer } from './transfer/peerProtocol'

export type Translate = (key: string, options?: Record<string, unknown>) => string

export type ConnectionPhase = 'idle' | 'connecting' | 'connected'

type FileStatus = 'idle' | 'downloading' | 'paused' | 'completed' | 'failed'

export interface TransferFile {
  offer: FileOffer
  received: number
  status: FileStatus
}
