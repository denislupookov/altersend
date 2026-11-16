import type { ConnectReason, ConnectStage } from '../rpc/events'

export interface ConnectProgressState {
  stage: ConnectStage
  reason: ConnectReason | null
}

export interface DialSocket {
  once(event: 'open', listener: () => void): unknown
  once(event: 'error', listener: (err: unknown) => void): unknown
}

type DialFailure = 'unreachable' | 'blocked'

const BLOCKED_CODES = new Set([
  'HOLEPUNCH_ABORTED',
  'HOLEPUNCH_DOUBLE_RANDOMIZED_NATS',
  'HOLEPUNCH_INVALID',
  'HOLEPUNCH_PROBE_TIMEOUT',
  'CANNOT_HOLEPUNCH',
  'REMOTE_NOT_HOLEPUNCHABLE',
  'REMOTE_NOT_HOLEPUNCHING',
  'RELAY_ABORTED'
])

const UNREACHABLE_CODES = new Set([
  'PEER_NOT_FOUND',
  'PEER_CONNECTION_FAILED',
  'REMOTE_ABORTED',
  'SERVER_ERROR'
])

export function classifyDialError(err: unknown): DialFailure | null {
  const code = (err as { code?: unknown } | null)?.code
  if (typeof code !== 'string') return null
  if (BLOCKED_CODES.has(code)) return 'blocked'
  if (UNREACHABLE_CODES.has(code)) return 'unreachable'
  return null
}

export function watchDialOpen(socket: DialSocket, onFailure: (err: unknown) => void): void {
  let opened = false
  socket.once('open', () => {
    opened = true
  })
  socket.once('error', (err) => {
    if (!opened) onFailure(err)
  })
}

export class ConnectProgress {
  private stage: ConnectStage = 'searching'
  private reason: ConnectReason | null = null

  constructor(
    private readonly publish: (state: ConnectProgressState) => void,
    private readonly relayEnabled: () => boolean
  ) {}

  reset(): void {
    this.stage = 'searching'
    this.reason = null
  }

  attempting(): void {
    if (this.stage !== 'searching') return
    this.update('reaching', this.reason)
  }

  relaying(): void {
    this.update('relaying', this.reason)
  }

  failed(err: unknown): void {
    const failure = classifyDialError(err)
    if (failure === 'blocked') {
      this.update(this.stage, this.relayEnabled() ? 'blocked' : 'relay-off')
      return
    }
    if (failure !== 'unreachable' || this.peerAnswered()) return
    this.update(this.stage === 'reaching' ? 'searching' : this.stage, 'unreachable')
  }

  private peerAnswered(): boolean {
    return this.stage === 'relaying' || this.reason === 'blocked' || this.reason === 'relay-off'
  }

  private update(stage: ConnectStage, reason: ConnectReason | null): void {
    if (stage === this.stage && reason === this.reason) return
    this.stage = stage
    this.reason = reason
    this.publish({ stage, reason })
  }
}
