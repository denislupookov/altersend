import type { DriveChannel, ChunkHeader, ControlMessage } from '../src/engine/types'

type MessageHandler = (message: ControlMessage) => void
type ChunkHandler = (header: ChunkHeader, data: Uint8Array) => void

class LoopbackChannel implements DriveChannel {
  peer!: LoopbackChannel
  private messageHandler?: MessageHandler
  private chunkHandler?: ChunkHandler
  private readonly pendingMessages: ControlMessage[] = []
  private readonly pendingChunks: Array<{ header: ChunkHeader; data: Uint8Array }> = []

  send(message: ControlMessage): void {
    queueMicrotask(() => this.peer.deliverMessage(message))
  }

  sendChunk(header: ChunkHeader, data: Uint8Array): void {
    const copy = data.slice()
    queueMicrotask(() => this.peer.deliverChunk(header, copy))
  }

  onMessage(handler: MessageHandler): void {
    this.messageHandler = handler
    for (const message of this.pendingMessages.splice(0)) handler(message)
  }

  onChunk(handler: ChunkHandler): void {
    this.chunkHandler = handler
    for (const { header, data } of this.pendingChunks.splice(0)) handler(header, data)
  }

  bufferedAmount(): number {
    return 0
  }

  close(): void {}

  private deliverMessage(message: ControlMessage): void {
    if (this.messageHandler) this.messageHandler(message)
    else this.pendingMessages.push(message)
  }

  private deliverChunk(header: ChunkHeader, data: Uint8Array): void {
    if (this.chunkHandler) this.chunkHandler(header, data)
    else this.pendingChunks.push({ header, data })
  }
}

export function createChannelPair(): [DriveChannel, DriveChannel] {
  const a = new LoopbackChannel()
  const b = new LoopbackChannel()
  a.peer = b
  b.peer = a
  return [a, b]
}
