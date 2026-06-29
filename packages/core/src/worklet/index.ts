import './abort-polyfill'
import './process-handlers'
import 'bare-buffer'
import 'bare-crypto'
import 'bare-dns'
import 'bare-tcp'
import 'bare-tls'
import 'bare-zlib'
import bareProcess from 'bare-process'
import os from 'bare-os'
import fs from 'bare-fs'
import { TransferOrchestrator } from './transfer/orchestrator'
import { isDeviceType } from './identity/device-type'
import { createReadyEvent } from './rpc/events'
import { API, encodeRPCPayload } from './rpc/protocol'
import { createTransferWorkerRPCServer } from './rpc/server'

function readArg(prefix: string): string | undefined {
  const flag = (Bare.argv as string[]).find((arg) => arg.startsWith(prefix))
  return flag?.slice(prefix.length)
}

const ipc = Bare.IPC
const storageFlag = (Bare.argv as string[]).find((arg) => arg.startsWith('--storage='))
if (!storageFlag)
  throw new Error('Missing --storage= argument in Bare.argv: ' + JSON.stringify(Bare.argv))
const dataRoot = storageFlag.slice('--storage='.length)
const storageRoot = dataRoot + '/core'
const identityFlag = (Bare.argv as string[]).find((arg) => arg.startsWith('--identity='))
const identityRoot = identityFlag
  ? identityFlag.slice('--identity='.length)
  : dataRoot + '/identities'

try {
  fs.rmSync(storageRoot, { recursive: true, force: true })
} catch (err) {
  if ((err as NodeJS.ErrnoException)?.code !== 'ENOENT') {
    console.warn('Core: startup storage wipe failed', err)
  }
}
const debugLog = (Bare.argv as string[]).includes('--debug-log')

function sendTransferEvent(message: unknown) {
  rpc.event(API.channels.event).send(encodeRPCPayload(message))
}

function pipeLog(level: 'log' | 'warn' | 'error', args: unknown[]) {
  if (level === 'log' && !debugLog) return
  try {
    const text = args
      .map((arg) => {
        if (typeof arg === 'string') return arg
        try {
          return JSON.stringify(arg)
        } catch {
          return String(arg)
        }
      })
      .join(' ')
    rpc.event(API.channels.log).send(encodeRPCPayload({ level, text }))
  } catch {}
}

// rpc must be created before the console hijack installs — pipeLog reads it.
const providedName = readArg('--device-name=')?.trim()
const displayName = providedName || os.hostname().replace(/\.local$/, '') || 'AlterSend Device'
const providedType = readArg('--device-type=')
const deviceType = isDeviceType(providedType) ? providedType : undefined
const orchestrator = new TransferOrchestrator(sendTransferEvent, storageRoot, identityRoot, {
  displayName,
  deviceType
})
const rpc = createTransferWorkerRPCServer(ipc, orchestrator, sendTransferEvent, () =>
  orchestrator.abortInFlight()
)

const originalLog: typeof console.log = console.log
const originalWarn: typeof console.warn = console.warn
const originalError: typeof console.error = console.error
console.log = (...args: unknown[]) => {
  originalLog(...args)
  pipeLog('log', args)
}
console.warn = (...args: unknown[]) => {
  originalWarn(...args)
  pipeLog('warn', args)
}
console.error = (...args: unknown[]) => {
  originalError(...args)
  pipeLog('error', args)
}

sendTransferEvent(createReadyEvent())

let shuttingDown = false
async function gracefulShutdown(_reason: string) {
  if (shuttingDown) return
  shuttingDown = true
  try {
    await orchestrator.destroy()
  } catch (err) {
    console.error('Core: orchestrator.destroy failed', err)
  }
}

bareProcess.on('beforeExit', () => {
  void gracefulShutdown('beforeExit')
})
bareProcess.on('SIGTERM', () => {
  void gracefulShutdown('SIGTERM')
})
bareProcess.on('SIGINT', () => {
  void gracefulShutdown('SIGINT')
})
bareProcess.on('suspend', () => {
  void orchestrator.suspend()
})
bareProcess.on('resume', () => {
  void orchestrator.resume()
})
