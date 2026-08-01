import Protomux from 'protomux'
import c from 'compact-encoding'
import { DRIVE_PROTOCOL, chunkEncoding } from '@altersend/drive/transport'
import { CONTROL_PROTOCOL, PROTOCOL_VERSION } from '@altersend/core/protocol'
import type { ChunkHeader, ControlMessage as DriveMessage, DriveChannel } from '@altersend/drive'

export type { FileOffer, TextOffer } from '@altersend/core'
import type { TransferOffer } from '@altersend/core'

export interface TransferReady {
  type: 'transfer-ready'
  transferId: string
  files: TransferOffer[]
}

interface TransferStart {
  type: 'transfer-start'
  transferId: string
  totalFiles: number
  totalBytes: number
}

type IncomingControl = (TransferReady | TransferStart | { type: string }) & {
  protocolVersion?: number
}

interface OutgoingControl {
  type: string
  [key: string]: unknown
}

interface DriveSession {
  onMessage?: (m: DriveMessage) => void
  onChunk?: (h: ChunkHeader, d: Uint8Array) => void
}

export interface PeerProtocol {
  sendControl: (message: OutgoingControl) => void
  driveSession: (transferId: string) => DriveChannel
}

export function createPeerProtocol(
  socket: unknown,
  onControl: (message: IncomingControl) => void
): PeerProtocol {
  const mux = Protomux.from(socket)

  const controlChannel = mux.createChannel({ protocol: CONTROL_PROTOCOL })
  if (!controlChannel) throw new Error('Could not open the control channel')
  const control = controlChannel.addMessage<IncomingControl>({
    encoding: c.json,
    onmessage: (message) => {
      if (message && typeof message.type === 'string') onControl(message)
    }
  })
  controlChannel.open()

  const driveChannel = mux.createChannel({ protocol: DRIVE_PROTOCOL })
  if (!driveChannel) throw new Error('Could not open the drive channel')

  const sessions = new Map<string, DriveSession>()

  const driveControl = driveChannel.addMessage<DriveMessage>({
    encoding: c.json,
    onmessage: (message) => {
      if (message && typeof message.transferId === 'string') {
        sessions.get(message.transferId)?.onMessage?.(message)
      }
    }
  })
  const driveChunk = driveChannel.addMessage<ChunkHeader & { data: Uint8Array }>({
    encoding: chunkEncoding,
    onmessage: ({ transferId, index, data }) => {
      sessions.get(transferId)?.onChunk?.({ transferId, index }, data)
    }
  })
  driveChannel.open()

  return {
    sendControl: (message) => control.send({ ...message, protocolVersion: PROTOCOL_VERSION }),
    driveSession: (transferId) => {
      const session: DriveSession = {}
      sessions.set(transferId, session)
      return {
        send: (message) => driveControl.send(message),
        sendChunk: (header, data) => driveChunk.send({ ...header, data }),
        onMessage: (handler) => {
          session.onMessage = handler
        },
        onChunk: (handler) => {
          session.onChunk = handler
        },
        bufferedAmount: () => (driveChannel.drained ? 0 : Infinity),
        close: () => {
          if (sessions.get(transferId) === session) sessions.delete(transferId)
        }
      }
    }
  }
}
