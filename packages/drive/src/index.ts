export { SenderSession, type SenderOptions } from './engine/sender'
export { ReceiverSession, type ReceiverOptions } from './engine/receiver'
export { IntegrityError, PEER_SILENCE_TIMEOUT_MS } from './engine/errors'
export { Bitmap } from './engine/bitmap'
export { firstFreePath } from './engine/paths'
export { selectChunkSize, chunkCount, chunkRange, type ChunkRange } from './engine/chunker'
export { hashChunk, createHasher, ready, type StreamingHasher } from './engine/hash'
export type {
  ChunkReader,
  ChunkWriter,
  DriveChannel,
  ChunkHeader,
  ControlMessage,
  StartMessage,
  NeedMessage,
  CompleteMessage,
  AckMessage,
  CancelMessage
} from './engine/types'
