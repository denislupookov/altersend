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
import * as SecureStore from 'expo-secure-store'
import { Platform } from 'react-native'
import { Worklet } from 'react-native-bare-kit'
import { isRelayEnabled } from '../lifecycle/relayStorage'

const STORAGE_ROOT_DIRNAME = 'altersend'
const IDENTITY_ROOT_DIRNAME = 'altersend-identity'
const DEVICE_SECRET_KEY = 'altersend.device.secret'

async function initDeviceKeychain(client: WorkerClient): Promise<void> {
  let sealed: string | null = null
  try {
    sealed = await SecureStore.getItemAsync(DEVICE_SECRET_KEY)
  } catch (err) {
    console.warn('mobileApi: device secret read failed', err)
  }
  try {
    const reply = await client.initDeviceSecret({ mode: 'managed', secret: sealed })
    if (reply.secretKey) await SecureStore.setItemAsync(DEVICE_SECRET_KEY, reply.secretKey)
  } catch (err) {
    console.warn('mobileApi: device secret init failed', err)
  }
}

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
  const relayConfPubkey = process.env.EXPO_PUBLIC_RELAY_CONF_PUBKEY?.trim()
  if (relayConfPubkey) args.push(`--relay-conf-pubkey=${relayConfPubkey}`)
  if (isRelayEnabled()) args.push('--relay-enabled')

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
      await initDeviceKeychain(client)
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
