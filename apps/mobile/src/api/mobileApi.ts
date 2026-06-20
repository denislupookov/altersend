import {
  API,
  createTransferWorkerClient,
  type RendererTransferEvent,
  type TransferMethod,
  type TransferRPC,
  type TransferWorkerProcess,
  type WorkerClient
} from '@altersend/core'
import Constants from 'expo-constants'
import { Directory, Paths } from 'expo-file-system'
import { Platform } from 'react-native'
import { Worklet } from 'react-native-bare-kit'

const STORAGE_ROOT_DIRNAME = 'altersend'
const IDENTITY_ROOT_DIRNAME = 'altersend-identity'

export function uriToPath(uri: string): string {
  return uri.replace(/^file:\/\//, '')
}

async function getWorkletArgs() {
  const cacheDirectory = Paths.cache

  if (!cacheDirectory?.uri) {
    throw new Error('Expo cache directory is unavailable on this device.')
  }

  const storageRoot = new Directory(cacheDirectory, STORAGE_ROOT_DIRNAME)

  if (!storageRoot.exists) {
    storageRoot.create({ idempotent: true, intermediates: true })
  }

  const documentDirectory = Paths.document
  if (!documentDirectory?.uri) {
    throw new Error('Expo document directory is unavailable on this device.')
  }
  const identityRoot = new Directory(documentDirectory, IDENTITY_ROOT_DIRNAME)
  if (!identityRoot.exists) {
    identityRoot.create({ idempotent: true, intermediates: true })
  }

  const args = [
    `--storage=${uriToPath(storageRoot.uri)}`,
    `--identity=${uriToPath(identityRoot.uri)}`
  ]
  const deviceName = Constants.deviceName?.trim()
  if (deviceName) args.push(`--device-name=${deviceName}`)
  const isPad = Platform.OS === 'ios' && (Platform as { isPad?: boolean }).isPad === true
  args.push(`--device-type=${isPad ? 'tablet' : 'phone'}`)
  return args
}

class MobileApi {
  private worklet: Worklet | null = null
  private client: WorkerClient | null = null
  private startPromise: Promise<void> | null = null
  private readonly eventListeners = new Set<(event: RendererTransferEvent) => void>()

  readonly worker: TransferRPC = new Proxy({} as TransferRPC, {
    get: (_target, prop) => {
      if (typeof prop !== 'string' || !(prop in API.methods)) return undefined
      return async (...args: unknown[]) => {
        const client = await this.getClient()
        const method = prop as TransferMethod
        return (client[method] as (...a: unknown[]) => Promise<unknown>)(...args)
      }
    }
  })

  async startP2P() {
    if (this.startPromise) {
      return this.startPromise
    }

    this.startPromise = (async () => {
      this.worklet = new Worklet()

      const source = Platform.select({
        // eslint-disable-next-line @typescript-eslint/no-require-imports -- Metro resolves require() of bundle files to runtime resource IDs; ES6 import changes semantics
        ios: require('../../bundles/app-ios.bundle.js'),
        // eslint-disable-next-line @typescript-eslint/no-require-imports -- Metro resolves require() of bundle files to runtime resource IDs; ES6 import changes semantics
        android: require('../../bundles/app-android.bundle.js')
      })
      const args = await getWorkletArgs()
      this.worklet.start('/app.bundle', source, args)

      const client = createTransferWorkerClient(
        this.worklet.IPC as unknown as TransferWorkerProcess,
        {
          onEvent: (event) => {
            for (const listener of this.eventListeners) {
              try {
                listener(event)
              } catch (err) {
                console.error('mobileApi: event listener threw', err)
              }
            }
          }
        }
      )

      await client.ready
      this.client = client
    })().catch(async (error: unknown) => {
      const failure = error instanceof Error ? error : new Error(String(error))

      this.client?.destroy(failure)
      this.client = null
      this.startPromise = null

      if (typeof this.worklet?.terminate === 'function') {
        this.worklet.terminate()
      }

      this.worklet = null
      throw failure
    })

    return this.startPromise
  }

  onTransferEvent = (cb: (message: RendererTransferEvent) => void) => {
    this.eventListeners.add(cb)
    return () => {
      this.eventListeners.delete(cb)
    }
  }

  private async getClient() {
    await this.startP2P()

    if (!this.client) {
      throw new Error('RPC not initialized. Call startP2P first.')
    }

    return this.client
  }
}

export const mobileApi = new MobileApi()
