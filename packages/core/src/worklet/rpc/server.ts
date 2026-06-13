import RPC, { type RPCRequest } from 'bare-rpc'
import { createErrorEvent, TRANSFER_ERROR_CODES } from './events'
import {
  API_BY_VALUE,
  BadRequestError,
  decodeRPCPayload,
  encodeRPCError,
  encodeRPCSuccess
} from './protocol'
import type { TransferRPC } from './protocol'
import { AbortError } from '../transfer/utils'

type EmitEvent = (message: unknown) => void

function toError(err: unknown) {
  return err instanceof Error ? err : new Error('Unknown worker error')
}

export function createTransferWorkerRPCServer(
  stream: unknown,
  orchestrator: TransferRPC,
  emitEvent: EmitEvent,
  abortInFlight: () => void = () => {}
) {
  let commandQueue = Promise.resolve<unknown>(null)

  async function runCommand<T>(handler: () => Promise<T>): Promise<T> {
    const next = commandQueue.then(handler)
    commandQueue = next.catch((err: unknown) => {
      if (err instanceof BadRequestError || err instanceof AbortError) return null
      const failure = toError(err)
      console.error('Core: Command queue error', failure)
      emitEvent(createErrorEvent(failure.message, TRANSFER_ERROR_CODES.transferFailed))
      return null
    })
    return next
  }

  const rpc = new RPC(stream, async (req: RPCRequest) => {
    const method = API_BY_VALUE[req.command]
    if (!method) {
      req.reply(encodeRPCError(`Unknown RPC command: ${req.command}`, 'UNKNOWN_COMMAND'))
      return
    }

    if (method === 'disconnect' || method === 'closePeers') abortInFlight()

    const args = decodeRPCPayload<unknown[]>(req.data) ?? []
    const invoke = orchestrator[method] as (...a: unknown[]) => Promise<unknown>

    try {
      const reply = await runCommand(() => invoke.apply(orchestrator, args))
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
