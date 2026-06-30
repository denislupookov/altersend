import {
  API,
  type RendererTransferEvent,
  type TransferMethod,
  type TransferRPC
} from '@altersend/core'

function requireBridge(): Bridge {
  if (typeof window === 'undefined' || !window.bridge) {
    throw new Error('Electron bridge not available')
  }

  return window.bridge
}

export function hasBridge(): boolean {
  return typeof window !== 'undefined' && typeof window.bridge !== 'undefined'
}

const worker: TransferRPC = new Proxy({} as TransferRPC, {
  get(_target, prop) {
    if (typeof prop !== 'string' || !(prop in API.methods)) return undefined
    const method = prop as TransferMethod
    return (...args: unknown[]) =>
      (requireBridge().invokeTransfer as (m: string, ...a: unknown[]) => Promise<unknown>)(
        method,
        ...args
      )
  }
})

export const bridgeApi = {
  worker,
  pkg() {
    return requireBridge().pkg()
  },
  startP2P() {
    return requireBridge().startP2P()
  },
  disconnectP2P() {
    return requireBridge().disconnectP2P()
  },
  onTransferEvent(cb: (message: RendererTransferEvent) => void) {
    return requireBridge().onTransferEvent(cb)
  },
  pickFiles() {
    return requireBridge().pickFiles()
  },
  pickDirectory() {
    return requireBridge().pickDirectory()
  },
  pickSaveFile(defaultName: string) {
    return requireBridge().pickSaveFile(defaultName)
  },
  getPathForFile(file: File) {
    return requireBridge().getPathForFile(file)
  },
  appRestart() {
    return requireBridge().appRestart()
  },
  showInFolder(filePath: string) {
    return requireBridge().showInFolder(filePath)
  },
  openFile(filePath: string) {
    return requireBridge().openFile(filePath)
  },
  openExternalUrl(url: string) {
    return requireBridge().openExternalUrl(url)
  },
  onDeepLink(cb: (url: string) => void) {
    return requireBridge().onDeepLink(cb)
  },
  onRuntimeUpdated(cb: () => void) {
    return requireBridge().onRuntimeUpdated(cb)
  },
  setSentryEnabled(enabled: boolean) {
    return requireBridge().setSentryEnabled(enabled)
  },
  requestCameraAccess() {
    return requireBridge().requestCameraAccess()
  },
  clipboardReadText() {
    return requireBridge().clipboardReadText()
  }
}
