declare module 'hyperswarm'
declare module 'hypercore-crypto'
declare module 'hyperdrive'
declare module 'corestore'
declare module 'b4a'
declare module 'pear-runtime'
declare module 'which-runtime'
declare module 'paparam'

declare var Bare: any

declare module '*.png' {
  const value: any
  export default value
}

declare module '*.svg' {
  const value: string
  export default value
}

declare module 'react' {
  interface CSSProperties {
    WebkitAppRegion?: 'drag' | 'no-drag'
  }
}

interface PickedFile {
  path: string
  name: string
  size?: number
}

declare global {
  type DownloadFileRequest = import('@altersend/core').DownloadFileRequest
  type DownloadFilesReply = import('@altersend/core').DownloadFilesReply
  type DisconnectReply = import('@altersend/core').DisconnectReply
  type HostReply = import('@altersend/core').HostReply
  type JoinReply = import('@altersend/core').JoinReply
  type RendererTransferEvent = import('@altersend/core').RendererTransferEvent
  type ShareFilesReply = import('@altersend/core').ShareFilesReply
  type TransferWorkerClient = import('@altersend/core').WorkerClient
  type TransferMethod = import('@altersend/core').TransferMethod
  type TransferMethodArgs<T extends TransferMethod> = TransferWorkerClient[T] extends (
    ...args: infer Args
  ) => Promise<any>
    ? Args
    : never
  type TransferMethodReturn<T extends TransferMethod> = TransferWorkerClient[T] extends (
    ...args: any[]
  ) => infer Result
    ? Result
    : never

  interface Bridge {
    pkg: () => { version: string }
    startP2P: () => Promise<boolean>
    disconnectP2P: () => Promise<boolean>
    invokeTransfer: <T extends TransferMethod>(
      method: T,
      ...args: TransferMethodArgs<T>
    ) => TransferMethodReturn<T>
    onTransferEvent: (cb: (message: RendererTransferEvent) => void) => () => void
    pickFiles: () => Promise<PickedFile[] | null>
    pickDirectory: () => Promise<PickedFile | null>
    pickSaveFile: (defaultName: string) => Promise<PickedFile | null>
    getPathForFile: (file: File) => string
    appRestart: () => Promise<unknown>
    onDeepLink: (cb: (url: string) => void) => () => void
    onRuntimeUpdated: (cb: () => void) => () => void
    showInFolder: (filePath: string) => Promise<void>
    openFile: (filePath: string) => Promise<string>
    openExternalUrl: (url: string) => Promise<void>
    setSentryEnabled: (enabled: boolean) => Promise<void>
    requestCameraAccess: () => Promise<boolean>
  }

  interface Window {
    bridge: Bridge
  }
}

export {}
