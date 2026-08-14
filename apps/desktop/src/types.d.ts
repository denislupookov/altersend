declare module 'hyperswarm'
declare module 'hypercore-crypto'
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

declare global {
  interface PickedFile {
    path: string
    name: string
    size: number
    relativePath?: string
  }

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

  type PickMode = 'files' | 'folders' | 'combined'

  type ShareExtensionState = 'enabled' | 'disabled' | 'unknown'

  interface Bridge {
    pkg: () => { version: string }
    platform: NodeJS.Platform
    startP2P: () => Promise<boolean>
    disconnectP2P: () => Promise<boolean>
    invokeTransfer: <T extends TransferMethod>(
      method: T,
      ...args: TransferMethodArgs<T>
    ) => TransferMethodReturn<T>
    onTransferEvent: (cb: (message: RendererTransferEvent) => void) => () => void
    pickFiles: (mode?: PickMode) => Promise<PickedFile[] | null>
    pickDirectory: () => Promise<string | null>
    pickSaveFile: (defaultName: string) => Promise<PickedFile | null>
    getPathForFile: (file: File) => string
    getDownloadFolder: () => Promise<string | null>
    chooseDownloadFolder: () => Promise<string | null>
    getAccountCode: () => Promise<string | null>
    setAccountCode: (code: string) => Promise<void>
    clearAccountCode: () => Promise<void>
    getAccountToken: () => Promise<string | null>
    setAccountToken: (token: string | null) => Promise<void>
    saveAccountCode: (contents: string, defaultName: string) => Promise<string | null>
    appRestart: () => Promise<unknown>
    onDeepLink: (cb: (url: string) => void) => () => void
    onExternalFiles: (cb: (files: PickedFile[]) => void) => () => void
    externalFilesReady: () => Promise<PickedFile[]>
    shareExtensionState: () => Promise<ShareExtensionState>
    openShareSettings: () => Promise<void>
    onRuntimeUpdated: (cb: () => void) => () => void
    showInFolder: (filePath: string) => Promise<void>
    openFile: (filePath: string) => Promise<string>
    openExternalUrl: (url: string) => Promise<void>
    setSentryEnabled: (enabled: boolean) => Promise<void>
    setThemePreference: (preference: string) => Promise<void>
    requestCameraAccess: () => Promise<boolean>
    clipboardReadText: () => Promise<string>
  }

  interface Window {
    bridge: Bridge
  }
}

export {}
