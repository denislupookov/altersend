export { createTransferWorkerClient } from './client/worker-client'
export type {
  WorkerClient,
  TransferWorkerClientOptions,
  TransferWorkerProcess
} from './client/worker-client'

export { isPathSafe, isValidHexKey } from './worklet/transfer/utils'

export { API } from './worklet/rpc/protocol'
export type {
  CustomRelayInput,
  SetRelayConfigInput,
  TestCustomRelayReply,
  TransferRPC,
  TransferMethod,
  TransferRole,
  RendererTransferEvent,
  IncomingFileOffer,
  HostReply,
  JoinReply,
  ShareFilesReply,
  DownloadFilesReply,
  DisconnectReply,
  DownloadFileRequest,
  DownloadFileResult,
  ShareFileRequest,
  RememberVoteInput,
  RememberVoteReply,
  InviteResponseInput,
  InviteResponseReply,
  RenamePeerInput,
  InitDeviceSecretReply,
  DeviceSecretInit
} from './worklet/rpc/protocol'

export { TRANSFER_ERROR_CODES } from './worklet/rpc/events'
export type { TransferStatus, TransferErrorCode } from './worklet/rpc/events'
export { MAX_DISPLAY_NAME_LEN } from './worklet/peers/remembered-peer'
export { MAX_FILES_PER_TRANSFER } from './worklet/transfer/control-validation'
export type { RememberedPeer } from './worklet/peers/remembered-peer'
export type { DeviceType } from './worklet/identity/device-type'
