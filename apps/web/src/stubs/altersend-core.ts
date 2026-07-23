export type * from '../../../../packages/core/src/worklet/rpc/protocol'
export type * from '../../../../packages/core/src/worklet/rpc/events'
export type * from '../../../../packages/core/src/worklet/transfer/control-channel'
export type { RememberedPeer } from '../../../../packages/core/src/worklet/peers/remembered-peer'

export const TRANSFER_ERROR_CODES = {
  peerUnreachable: 'peer_unreachable',
  invalidTopic: 'invalid_topic',
  joinFailed: 'join_failed',
  transferFailed: 'transfer_failed',
  downloadFailed: 'download_failed'
} as const

export const MAX_DISPLAY_NAME_LEN = 256
