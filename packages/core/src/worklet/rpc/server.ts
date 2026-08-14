import RPC, { type RPCRequest } from 'bare-rpc'
import { createErrorEvent, TRANSFER_ERROR_CODES } from './events'
import {
  API_BY_VALUE,
  BadRequestError,
  decodeRPCPayload,
  encodeRPCError,
  encodeRPCSuccess
} from './protocol'
import type { TransferMethod, TransferRPC } from './protocol'
import { AbortError } from '../transfer/utils'
import { SerialQueue } from './serial-queue'

type EmitEvent = (message: unknown) => void

function toError(err: unknown) {
  return err instanceof Error ? err : new Error('Unknown worker error')
}

const IMMEDIATE_METHODS = new Set<TransferMethod>([
  'pauseDownload',
  'testCustomRelay',
  'inviteDevice',
  'respondToInvite'
])

export function runsWithoutWaiting(method: TransferMethod): boolean {
  return IMMEDIATE_METHODS.has(method)
}

export function isFileTransfer(method: TransferMethod): boolean {
  return method === 'downloadFiles'
}

const DOWNLOAD_DRAIN_TIMEOUT_MS = 5_000

export function createTransferWorkerRPCServer(
  stream: unknown,
  orchestrator: TransferRPC,
  emitEvent: EmitEvent,
  abortInFlight: () => void = () => {}
) {
  const reportFailure = (err: unknown) => {
    if (err instanceof BadRequestError || err instanceof AbortError) return null
    const failure = toError(err)
    console.error('Core: Command queue error', failure)
    emitEvent(createErrorEvent(failure.message, TRANSFER_ERROR_CODES.transferFailed))
    return null
  }

  const downloads = new SerialQueue(reportFailure)
  const commands = new SerialQueue(reportFailure)

  function schedule<T>(method: TransferMethod, task: () => Promise<T>): Promise<T> {
    if (runsWithoutWaiting(method)) return task()
    return isFileTransfer(method) ? downloads.run(task) : commands.run(task)
  }

  function waitForDownloadsToStop(): Promise<unknown> {
    return Promise.race([
      downloads.whenIdle(),
      new Promise((resolve) => setTimeout(resolve, DOWNLOAD_DRAIN_TIMEOUT_MS))
    ])
  }

  const rpc = new RPC(stream, async (req: RPCRequest) => {
    const method = API_BY_VALUE[req.command]
    if (!method) {
      req.reply(encodeRPCError(`Unknown RPC command: ${req.command}`, 'UNKNOWN_COMMAND'))
      return
    }

    if (method === 'disconnect' || method === 'closePeers') {
      abortInFlight()
      await waitForDownloadsToStop()
    }

    const args = decodeRPCPayload<unknown[]>(req.data) ?? []
    const invoke = orchestrator[method] as (...a: unknown[]) => Promise<unknown>
    const run = () => invoke.apply(orchestrator, args)

    try {
      const reply = await schedule(method, run)
      req.reply(encodeRPCSuccess(reply))
    } catch (err: unknown) {
      if (err instanceof BadRequestError) {
        req.reply(encodeRPCError(err.message, 'BAD_REQUEST', err.transferErrorCode))
        return
      }
      if (err instanceof AbortError) {
        req.reply(encodeRPCError('Cancelled', 'BAD_REQUEST'))
        return
      }
      const failure = toError(err)
      console.error('Core: RPC command failed', failure)
      req.reply(encodeRPCError(failure.message))
    }
  })

  return rpc
}
