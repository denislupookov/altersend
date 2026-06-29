import Protomux, { type ProtomuxMessage } from 'protomux'
import type { PeerSocket } from 'hyperswarm'
import c from 'compact-encoding'
import { isValidControlMessage } from './control-validation'
import type { DeviceType } from '../identity/device-identity-store'

export const PROTOCOL_VERSION = 1

export interface FileOffer {
  id: string
  transferId: string
  name: string
  path: string
  size: number
  driveKey: string
  kind: 'file'
}

export interface TextOffer {
  id: string
  transferId: string
  kind: 'text'
  content: string
}

export type TransferOffer = FileOffer | TextOffer

export interface TransferReady {
  type: 'transfer-ready'
  transferId: string
  files: TransferOffer[]
}

export interface TransferStart {
  type: 'transfer-start'
  transferId: string
  totalFiles: number
  totalBytes: number
}

export interface DownloadRequest {
  type: 'download-request'
  transferId: string
  fileId: string
  fileName: string
  path: string
  totalBytes: number
}

export interface DownloadProgress {
  type: 'download-progress'
  transferId: string
  fileId: string
  fileName: string
  bytesTransferred: number
  totalBytes: number
}

export interface DownloadComplete {
  type: 'download-complete'
  transferId: string
  fileId: string
  fileName: string
  savedTo: string
}

export interface DownloadFailed {
  type: 'download-failed'
  transferId: string
  fileId: string
  fileName: string
  message: string
}

export interface PairingInfo {
  type: 'pairing-info'
  devicePubkey: string
  displayName: string
  deviceType: DeviceType
  capabilities: { canBackground: boolean }
  signature: string
}

export interface RememberVote {
  type: 'remember-vote'
  transferId: string
  vote: 'remember' | 'no'
  isMine: boolean
}

export interface Recognition {
  type: 'recognition'
  signature: string
}

export interface DeviceInvite {
  type: 'invite'
  displayName: string
  deviceType: DeviceType
  topic: string
  fileCount?: number
  totalSize?: number
}

export interface DeviceInviteResponse {
  type: 'invite-response'
  topic: string
  response: 'declined'
}

export type PeerControlMessage =
  | TransferStart
  | TransferReady
  | DownloadRequest
  | DownloadProgress
  | DownloadComplete
  | DownloadFailed
  | PairingInfo
  | RememberVote
  | Recognition
  | DeviceInvite
  | DeviceInviteResponse

type PeerControlHandler = (message: PeerControlMessage) => void

export class PeerControlChannel {
  private readonly message: ProtomuxMessage
  private opened = false
  private readonly pending: PeerControlMessage[] = []

  constructor(message: ProtomuxMessage) {
    this.message = message
  }

  static create(socket: PeerSocket, onmessage: PeerControlHandler): PeerControlChannel | null {
    const mux = Protomux.from(socket)
    let instance: PeerControlChannel | null = null
    const channel = mux.createChannel({
      protocol: 'altersend/control',
      onopen: () => {
        if (instance) instance.flush()
      }
    })

    if (!channel) return null

    const message = channel.addMessage({
      encoding: c.json,
      onmessage: (raw: unknown) => {
        if (!isValidControlMessage(raw)) {
          const m = raw as { type?: unknown; protocolVersion?: unknown } | null
          console.warn(
            'PeerControlChannel: dropping invalid message',
            'protocolVersion=',
            m?.protocolVersion,
            'type=',
            m?.type
          )
          return
        }
        onmessage(raw)
      }
    })

    channel.open()
    instance = new PeerControlChannel(message)
    return instance
  }

  send(message: PeerControlMessage): void {
    if (!this.opened) {
      this.pending.push(message)
      return
    }
    this.message.send({ ...message, protocolVersion: PROTOCOL_VERSION })
  }

  private flush(): void {
    this.opened = true
    const queue = this.pending.splice(0)
    for (const msg of queue) {
      this.message.send({ ...msg, protocolVersion: PROTOCOL_VERSION })
    }
  }
}
