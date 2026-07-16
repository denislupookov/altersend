export interface ChunkReader {
  size(): Promise<number>
  read(offset: number, length: number): Promise<Uint8Array>
  close(): Promise<void>
}

export interface ChunkWriter {
  allocate(size: number): Promise<void>
  write(offset: number, data: Uint8Array): Promise<void>
  readBack(offset: number, length: number): Promise<Uint8Array | null>
  finalize(): Promise<string>
  abort(): Promise<void>
}

export interface DriveChannel {
  send(message: ControlMessage): void
  sendChunk(header: ChunkHeader, data: Uint8Array): void
  onMessage(handler: (message: ControlMessage) => void): void
  onChunk(handler: (header: ChunkHeader, data: Uint8Array) => void): void
  bufferedAmount(): number
  close(): void
}

export interface ChunkHeader {
  transferId: string
  index: number
  hash: string
}

export type ControlMessage =
  | StartMessage
  | NeedMessage
  | CompleteMessage
  | AckMessage
  | CancelMessage

export interface StartMessage {
  type: 'start'
  transferId: string
  name: string
  size: number
  chunkSize: number
}

export interface NeedMessage {
  type: 'need'
  transferId: string
  indices: number[]
}

export interface CompleteMessage {
  type: 'complete'
  transferId: string
  fileHash: string
}

export interface AckMessage {
  type: 'ack'
  transferId: string
  savedTo: string
}

export interface CancelMessage {
  type: 'cancel'
  transferId: string
  reason?: string
}
