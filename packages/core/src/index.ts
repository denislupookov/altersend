export { createTransferWorkerClient } from './client/worker-client'
export type {
  WorkerClient,
  TransferWorkerClientOptions,
  TransferWorkerProcess
} from './client/worker-client'

export { isPathSafe } from './worklet/transfer/utils'

export { API } from './worklet/rpc/protocol'
export type {
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
  ShareFileRequest
} from './worklet/rpc/protocol'

export { TRANSFER_ERROR_CODES } from './worklet/rpc/events'
export type { TransferStatus, TransferErrorCode } from './worklet/rpc/events'
