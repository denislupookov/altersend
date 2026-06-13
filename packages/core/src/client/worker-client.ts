import RPC, { type RPCRequest } from 'bare-rpc'
import { API, decodeRPCPayload, encodeRPCPayload } from '../worklet/rpc/protocol'
import type {
  RPCResponse,
  RendererTransferEvent,
  TransferErrorCode,
  TransferMethod,
  TransferRPC,
  WorkerTransferEvent
} from '../worklet/rpc/protocol'

export interface TransferWorkerProcess {
  on(event: 'data', listener: (data: Uint8Array) => void): unknown
  on(event: 'error', listener: (err: Error) => void): unknown
  write(data: Uint8Array): boolean
}

export interface TransferWorkerClientOptions {
  onEvent?: (event: RendererTransferEvent) => void
  debug?: boolean
}

export interface WorkerClient extends TransferRPC {
  ready: Promise<void>
  destroy(err?: Error): void
}

function createDeferred() {
  let resolve!: () => void
  let reject!: (err: Error) => void
  const promise = new Promise<void>((res, rej) => {
    resolve = res
    reject = rej
  })

  return { promise, resolve, reject }
}

function toError(err: unknown, fallback: string) {
  return err instanceof Error ? err : new Error(fallback)
}

function createWorkerResponseError(response: Extract<RPCResponse<unknown>, { ok: false }>) {
  const error = new Error(response.error.message) as Error & {
    code?: TransferErrorCode
    rpcCode?: string
    transferErrorCode?: TransferErrorCode
  }
  error.rpcCode = response.error.code
  if (response.error.transferErrorCode) {
    error.code = response.error.transferErrorCode
    error.transferErrorCode = response.error.transferErrorCode
  }
  return error
}

class TransferWorkerClientCore {
  public rpc: RPC
  public ready: Promise<void>
  public readyResolved: boolean
  public closedError: Error | null
  private readonly markReadyInternal: () => void
  private readonly failReadyInternal: (err: Error) => void
  private readonly pendingRejects: Set<(err: Error) => void>

  constructor(worker: TransferWorkerProcess, options: TransferWorkerClientOptions) {
    const readyState = createDeferred()

    this.ready = readyState.promise
    this.readyResolved = false
    this.closedError = null
    this.pendingRejects = new Set()
    this.markReadyInternal = () => {
      if (this.readyResolved) return
      this.readyResolved = true
      readyState.resolve()
    }
    this.failReadyInternal = (err: Error) => {
      if (this.readyResolved) return
      readyState.reject(err)
    }

    this.rpc = new RPC(worker, (req: RPCRequest) => {
      if (req.command === API.channels.log) {
        const log = decodeRPCPayload<{ level: 'log' | 'warn' | 'error'; text: string }>(req.data)
        if (!log) return
        const prefix = '[worklet]'
        if (log.level === 'warn') console.warn(prefix, log.text)
        else if (log.level === 'error') console.error(prefix, log.text)
        else console.log(prefix, log.text)
        return
      }

      if (req.command !== API.channels.event) return
      const message = decodeRPCPayload<WorkerTransferEvent>(req.data)
      if (!message) return

      if (options.debug) {
        if (message.type === 'error') {
          console.log('[client] RPC event error:', message.message)
        } else {
          console.log('[client] RPC event', message.type, 'state' in message ? message.state : '')
        }
      }

      if (message.type === 'ready') {
        this.markReadyInternal()
        return
      }

      options.onEvent?.(message as RendererTransferEvent)
    })
  }

  destroy(err?: Error) {
    const failure = err ?? new Error('Worker client destroyed')
    this.closedError = failure
    this.failReadyInternal(failure)

    for (const reject of this.pendingRejects) reject(failure)
    this.pendingRejects.clear()
  }

  async invoke<T>(method: TransferMethod, args: unknown[]): Promise<T> {
    await this.ready

    if (this.closedError) throw this.closedError

    const command = API.methods[method]
    const request = this.rpc.request(command)
    request.send(encodeRPCPayload(args))

    return await new Promise<T>((resolve, reject) => {
      const onExit = (err: Error) => reject(err)
      this.pendingRejects.add(onExit)

      request
        .reply()
        .then((reply) => {
          this.pendingRejects.delete(onExit)

          const response = decodeRPCPayload<RPCResponse<T>>(reply)
          if (!response) {
            reject(new Error(`Worker request ${method} returned an empty reply`))
            return
          }

          if (!response.ok) {
            reject(createWorkerResponseError(response))
            return
          }

          resolve(response.data)
        })
        .catch((err) => {
          this.pendingRejects.delete(onExit)
          reject(toError(err, `Worker request ${method} failed`))
        })
    })
  }
}

export function createTransferWorkerClient(
  worker: TransferWorkerProcess,
  options: TransferWorkerClientOptions = {}
): WorkerClient {
  const core = new TransferWorkerClientCore(worker, options)

  return new Proxy(core, {
    get(target, prop, receiver) {
      if (typeof prop === 'string' && prop in API.methods) {
        return (...args: unknown[]) => target.invoke(prop as TransferMethod, args)
      }
      return Reflect.get(target, prop, receiver)
    }
  }) as unknown as WorkerClient
}
