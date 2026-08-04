import { requireOptionalNativeModule } from 'expo-modules-core'

export const INDETERMINATE_PROGRESS = -1

export interface TransferNotificationContent {
  title: string
  text: string
  subText: string
  progress: number
}

interface TransferServiceNativeModule {
  start(content: TransferNotificationContent, channelName: string): Promise<void>
  update(content: TransferNotificationContent): Promise<void>
  notifyCompleted(title: string, text: string, channelName: string): Promise<void>
  setTransferring(transferring: boolean): Promise<void>
  stop(): Promise<void>
  addListener(event: 'onStopped', listener: () => void): { remove: () => void }
}

const nativeModule = requireOptionalNativeModule<TransferServiceNativeModule>('TransferService')

function withModule(call: (module: TransferServiceNativeModule) => Promise<void>): Promise<void> {
  return nativeModule ? call(nativeModule) : Promise.resolve()
}

export function isTransferServiceAvailable(): boolean {
  return nativeModule != null
}

export function startTransferService(
  content: TransferNotificationContent,
  channelName: string
): Promise<void> {
  return withModule((module) => module.start(content, channelName))
}

export function updateTransferService(content: TransferNotificationContent): Promise<void> {
  return withModule((module) => module.update(content))
}

export function notifyTransferCompleted(
  title: string,
  text: string,
  channelName: string
): Promise<void> {
  return withModule((module) => module.notifyCompleted(title, text, channelName))
}

export function setTransferServiceTransferring(transferring: boolean): Promise<void> {
  return withModule((module) => module.setTransferring(transferring))
}

export function stopTransferService(): Promise<void> {
  return withModule((module) => module.stop())
}

export function onTransferServiceStopped(listener: () => void): () => void {
  if (!nativeModule) return () => {}
  const subscription = nativeModule.addListener('onStopped', listener)
  return () => subscription.remove()
}
