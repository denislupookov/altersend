import Protomux, { type ProtomuxMessage } from 'protomux'
import c, { type Encoding } from 'compact-encoding'
import type { PeerSocket } from 'hyperswarm'
import {
  sendFile,
  type ChunkHeader,
  type ControlMessage,
  type DriveChannel
} from '@altersend/drive'

const DRIVE_PROTOCOL = 'altersend/drive'

interface ChunkFrame extends ChunkHeader {
  data: Uint8Array
}

const chunkEncoding: Encoding<ChunkFrame> = {
  preencode(state, frame) {
    c.string.preencode(state, frame.transferId)
    c.uint.preencode(state, frame.index)
    c.raw.preencode(state, frame.data)
  },
  encode(state, frame) {
    c.string.encode(state, frame.transferId)
    c.uint.encode(state, frame.index)
    c.raw.encode(state, frame.data)
  },
  decode(state) {
    return {
      transferId: c.string.decode(state),
      index: c.uint.decode(state),
      data: c.raw.decode(state)
    }
  }
}

interface Session {
  onMessage?: (message: ControlMessage) => void
  onChunk?: (header: ChunkHeader, data: Uint8Array) => void
  pendingCancel?: ControlMessage
}

type ProtomuxChannelLike = NonNullable<ReturnType<Protomux['createChannel']>>

function cancelForDisconnect(transferId: string): ControlMessage {
  return { type: 'cancel', transferId, reason: 'Peer disconnected' }
}

export class PeerDrive {
  private readonly channel: ProtomuxChannelLike
  private readonly control: ProtomuxMessage<ControlMessage>
  private readonly chunk: ProtomuxMessage<ChunkFrame>
  private readonly sessions = new Map<string, Session>()
  private readonly socket: PeerSocket
  private readonly writable: (() => void)[] = []
  private inFlightBytes = 0
  private readonly sends = new Map<string, { abort: AbortController; done: Promise<void> }>()
  private destroyed = false

  readonly supported: Promise<boolean>

  private constructor(channel: ProtomuxChannelLike, socket: PeerSocket) {
    this.channel = channel
    this.socket = socket
    socket.on('drain', this.onDrain)
    this.control = channel.addMessage<ControlMessage>({
      encoding: c.json,
      onmessage: (message) => {
        if (message && typeof message.transferId === 'string') {
          this.sessions.get(message.transferId)?.onMessage?.(message)
        }
      }
    })
    this.chunk = channel.addMessage<ChunkFrame>({
      encoding: chunkEncoding,
      onmessage: ({ transferId, index, data }) => {
        this.sessions.get(transferId)?.onChunk?.({ transferId, index }, data)
      }
    })
    channel.open()
    this.supported = channel.fullyOpened()
  }

  static create(socket: PeerSocket): PeerDrive | null {
    const channel = Protomux.from(socket).createChannel({ protocol: DRIVE_PROTOCOL })
    return channel ? new PeerDrive(channel, socket) : null
  }

  session(fileId: string): DriveChannel {
    const session: Session = {}
    if (this.destroyed) session.pendingCancel = cancelForDisconnect(fileId)
    else this.sessions.set(fileId, session)

    return {
      send: (message) => this.control.send(message),
      sendChunk: (header, data) => {
        this.inFlightBytes += data.length
        this.chunk.send({ ...header, data })
      },
      onMessage: (handler) => {
        session.onMessage = handler
        if (session.pendingCancel) handler(session.pendingCancel)
      },
      onChunk: (handler) => {
        session.onChunk = handler
      },
      bufferedAmount: () => this.outstandingBytes(),
      whenWritable: () => this.whenWritable(),
      close: () => {
        this.sessions.delete(fileId)
      }
    }
  }

  private readonly onDrain = (): void => {
    this.inFlightBytes = 0
    this.releaseWaiters()
  }

  private releaseWaiters(): void {
    const waiting = this.writable.splice(0)
    for (const resolve of waiting) resolve()
  }

  private whenWritable(): Promise<void> {
    if (this.destroyed || this.channel.drained) return Promise.resolve()
    return new Promise((resolve) => this.writable.push(resolve))
  }

  private outstandingBytes(): number {
    if (this.destroyed || this.channel.drained) this.inFlightBytes = 0
    return this.inFlightBytes
  }

  async serve(fileId: string, name: string, localPath: string | null): Promise<void> {
    const previous = this.sends.get(fileId)
    const abort = new AbortController()
    let settle!: () => void
    const done = new Promise<void>((resolve) => {
      settle = resolve
    })
    this.sends.set(fileId, { abort, done })

    if (previous) {
      previous.abort.abort()
      await previous.done
    }

    let channel: DriveChannel | null = null

    try {
      if (!(await this.supported)) return
      if (!localPath) {
        this.control.send({
          type: 'cancel',
          transferId: fileId,
          reason: 'File is no longer readable on the sender'
        })
        return
      }
      channel = this.session(fileId)

      await sendFile(localPath, channel, {
        transferId: fileId,
        name,
        signal: abort.signal,
        notifyPeerOnCancel: false
      })
    } finally {
      channel?.close()
      if (this.sends.get(fileId)?.abort === abort) this.sends.delete(fileId)
      settle()
    }
  }

  cancel(): void {
    for (const entry of this.sends.values()) entry.abort.abort()
  }

  destroy(): void {
    this.destroyed = true
    this.socket.off('drain', this.onDrain)
    this.releaseWaiters()
    this.cancel()
    for (const [transferId, session] of this.sessions) {
      const cancel = cancelForDisconnect(transferId)
      if (session.onMessage) session.onMessage(cancel)
      else session.pendingCancel = cancel
    }
    this.sessions.clear()

    try {
      this.channel.close()
    } catch {}
  }
}
