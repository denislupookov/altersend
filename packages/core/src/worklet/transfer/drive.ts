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
    c.string.preencode(state, frame.hash)
    c.raw.preencode(state, frame.data)
  },
  encode(state, frame) {
    c.string.encode(state, frame.transferId)
    c.uint.encode(state, frame.index)
    c.string.encode(state, frame.hash)
    c.raw.encode(state, frame.data)
  },
  decode(state) {
    return {
      transferId: c.string.decode(state),
      index: c.uint.decode(state),
      hash: c.string.decode(state),
      data: c.raw.decode(state)
    }
  }
}

interface Session {
  onMessage?: (message: ControlMessage) => void
  onChunk?: (header: ChunkHeader, data: Uint8Array) => void
}

type ProtomuxChannelLike = NonNullable<ReturnType<Protomux['createChannel']>>

export class PeerDrive {
  private readonly channel: ProtomuxChannelLike
  private readonly control: ProtomuxMessage<ControlMessage>
  private readonly chunk: ProtomuxMessage<ChunkFrame>
  private readonly sessions = new Map<string, Session>()
  private readonly sends = new Map<string, AbortController>()

  readonly supported: Promise<boolean>

  private constructor(channel: ProtomuxChannelLike) {
    this.channel = channel
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
      onmessage: ({ transferId, index, hash, data }) => {
        this.sessions.get(transferId)?.onChunk?.({ transferId, index, hash }, data)
      }
    })
    channel.open()
    this.supported = channel.fullyOpened()
  }

  static create(socket: PeerSocket): PeerDrive | null {
    const channel = Protomux.from(socket).createChannel({ protocol: DRIVE_PROTOCOL })
    return channel ? new PeerDrive(channel) : null
  }

  session(fileId: string): DriveChannel {
    const session: Session = {}
    this.sessions.set(fileId, session)

    return {
      send: (message) => this.control.send(message),
      sendChunk: (header, data) => this.chunk.send({ ...header, data }),
      onMessage: (handler) => {
        session.onMessage = handler
      },
      onChunk: (handler) => {
        session.onChunk = handler
      },
      bufferedAmount: () => (this.channel.drained ? 0 : Number.POSITIVE_INFINITY),
      close: () => {
        this.sessions.delete(fileId)
      }
    }
  }

  async serve(fileId: string, name: string, localPath: string): Promise<void> {
    if (this.sends.has(fileId)) return
    const abort = new AbortController()

    this.sends.set(fileId, abort)
    let channel: DriveChannel | null = null

    try {
      if (!(await this.supported)) return
      channel = this.session(fileId)

      await sendFile(localPath, channel, {
        transferId: fileId,
        name,
        signal: abort.signal
      })
    } finally {
      channel?.close()
      this.sends.delete(fileId)
    }
  }

  cancel(): void {
    for (const abort of this.sends.values()) abort.abort()
  }

  destroy(): void {
    this.cancel()
    this.sessions.clear()

    try {
      this.channel.close()
    } catch {}
  }
}
