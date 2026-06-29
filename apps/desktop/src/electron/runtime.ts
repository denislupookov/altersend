import { app, safeStorage } from 'electron'
import fs from 'fs'
import os from 'os'
import path from 'path'
import { fileURLToPath } from 'url'
import PearRuntime from 'pear-runtime'
import {
  API,
  type RendererTransferEvent,
  type TransferMethod,
  type WorkerClient
} from '@altersend/core'
import { isMac, isLinux } from 'which-runtime'
import { command, flag, sloppy } from 'paparam'
import { createRequire } from 'module'
import { getAppPath, getWorkerClientPath, getWorkerEntryPath } from './workerPaths.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const _require = createRequire(import.meta.url)
const pkgPath = path.join(__dirname, '..', '..', 'package.json')
const pkg = _require(pkgPath)

const { productName, version, upgrade } = pkg

type Broadcast = (name: string, data: unknown) => void

interface WorkerHandle {
  destroy: () => void
  stdout: {
    on: (event: 'data', cb: (chunk: unknown) => void) => void
    removeListener: (event: 'data', cb: (chunk: unknown) => void) => void
  }
  stderr: {
    on: (event: 'data', cb: (chunk: unknown) => void) => void
    removeListener: (event: 'data', cb: (chunk: unknown) => void) => void
  }
  on: (event: 'error', cb: (err: Error) => void) => void
  once: (event: 'exit', cb: (code: number) => void) => void
}

export interface PearRuntimeInstance {
  storage: string
  run: (path: string, args: string[]) => WorkerHandle
  updater: {
    updated: boolean
    on: (event: 'updating' | 'updated', cb: () => void | Promise<void>) => void
    removeListener: (event: 'updating' | 'updated', cb: () => void | Promise<void>) => void
    applyUpdate: () => Promise<void>
  }
}

interface WorkerRuntime {
  worker: WorkerHandle
  client: WorkerClient
  ready: Promise<void>
}

export interface DesktopRuntime {
  readonly metadata: {
    pkg: typeof pkg
    productName: string
    protocol: string
    version: string
    upgrade: string
  }
  readonly allowMultipleInstances: boolean
  getPear: () => PearRuntimeInstance
  startWorker: (specifier: string, args?: string[]) => Promise<boolean>
  invokeWorker: (specifier: string, method: TransferMethod, ...args: unknown[]) => Promise<unknown>
  disconnectWorker: (specifier: string) => boolean
  restartApp: () => void
  forwardDeepLink: (url: string) => void
}

const cmd = command(
  productName,
  flag('--storage <path>', 'pass custom storage to pear-runtime'),
  flag('--no-updates', 'start without OTA updates'),
  flag('--multi', 'allow multiple instances'),
  sloppy({ flags: true, args: true })
)

const cliArgs = (app.isPackaged ? process.argv.slice(1) : process.argv.slice(2)).filter(
  (arg) => arg !== '--no-sandbox'
)
cmd.parse(cliArgs)

const pearStore = cmd.flags.storage
const updates = (process as NodeJS.Process & { windowsStore?: boolean }).windowsStore
  ? false
  : cmd.flags.updates

function isTransferMethod(method: unknown): method is TransferMethod {
  return typeof method === 'string' && method in API.methods
}

function migrateIdentityIfNeeded(oldRoot: string, newRoot: string): void {
  const oldFile = path.join(oldRoot, 'device.json')
  const newFile = path.join(newRoot, 'device.json')
  try {
    if (!fs.existsSync(newFile) && fs.existsSync(oldFile)) {
      fs.mkdirSync(newRoot, { recursive: true })
      fs.cpSync(oldRoot, newRoot, { recursive: true })
    }
  } catch (err) {
    console.warn('[runtime] identity migration failed (non-fatal):', err)
  }
}

async function initDeviceKeychain(client: WorkerClient, identityRoot: string): Promise<void> {
  const keyPath = path.join(identityRoot, 'device.key')
  const available = safeStorage.isEncryptionAvailable()

  let sealed: string | null = null
  if (available) {
    try {
      if (fs.existsSync(keyPath)) sealed = safeStorage.decryptString(fs.readFileSync(keyPath))
    } catch (err) {
      console.warn('[runtime] device key decrypt failed:', err)
    }
  }

  try {
    await client.ready
    const reply = await client.initDeviceSecret(
      available ? { mode: 'managed', secret: sealed } : { mode: 'legacy' }
    )
    if (available && reply.secretKey) {
      fs.mkdirSync(identityRoot, { recursive: true })
      const tmp = keyPath + '.tmp'
      fs.writeFileSync(tmp, safeStorage.encryptString(reply.secretKey))
      fs.renameSync(tmp, keyPath)
    }
  } catch (err) {
    console.warn('[runtime] device key init failed:', err)
  }
}

function appDataDir(name: string): string {
  return isMac
    ? path.join(os.homedir(), 'Library', 'Application Support', name)
    : isLinux
      ? path.join(os.homedir(), '.config', name)
      : path.join(os.homedir(), 'AppData', 'Local', name)
}

export function createDesktopRuntime({ broadcast }: { broadcast: Broadcast }): DesktopRuntime {
  const workers = new Map<string, WorkerRuntime>()
  let pear: PearRuntimeInstance | null = null

  function getPear() {
    if (pear) return pear

    const appPath = getAppPath()
    const dir = pearStore || appDataDir(appPath === null ? `${productName}-dev` : productName)

    const extension = isLinux ? '.AppImage' : isMac ? '.app' : '.msix'
    const instance: PearRuntimeInstance = new PearRuntime({
      name: `${productName}${extension}`,
      dir,
      app: appPath,
      updates,
      version,
      upgrade,
      win32: { restart: true }
    })
    pear = instance

    instance.updater.on('updating', () => {
      broadcast('runtime:updating', null)
    })
    instance.updater.on('updated', async () => {
      await instance.updater.applyUpdate()
      broadcast('runtime:updated', null)
    })

    return instance
  }

  function getWorker(specifier: string, args: string[] = []): WorkerRuntime {
    const existing = workers.get(specifier)
    if (existing) return existing

    const pear = getPear()
    const workerPath = getWorkerEntryPath()
    const workerClientPath = getWorkerClientPath()
    const { createTransferWorkerClient } = _require(workerClientPath) as {
      createTransferWorkerClient: (
        worker: WorkerHandle,
        options?: { onEvent?: (event: RendererTransferEvent) => void }
      ) => WorkerClient
    }

    const identityRoot = path.join(path.dirname(pear.storage), 'identity')
    migrateIdentityIfNeeded(path.join(pear.storage, 'identities'), identityRoot)

    const worker = pear.run(workerPath, [
      `--storage=${pear.storage}`,
      `--identity=${identityRoot}`,
      '--device-type=desktop',
      ...args
    ])
    const client = createTransferWorkerClient(worker, {
      onEvent: (message: RendererTransferEvent) => {
        broadcast('pear:worker:event:' + specifier, message)
      }
    })
    initDeviceKeychain(client, identityRoot).catch(() => {})
    const runtime: WorkerRuntime = {
      worker,
      client,
      ready: client.ready
    }

    function sendWorkerStdout(data: unknown) {
      process.stdout.write(`[worker:${specifier}] ${String(data)}`)
      broadcast('pear:worker:stdout:' + specifier, data)
    }

    function sendWorkerStderr(data: unknown) {
      process.stderr.write(`[worker:${specifier}] ${String(data)}`)
      broadcast('pear:worker:stderr:' + specifier, data)
    }

    function onBeforeQuit() {
      worker.destroy()
    }

    function cleanupWorker(err: Error, exitCode: number | null) {
      runtime.client.destroy(err)
      app.removeListener('before-quit', onBeforeQuit)
      worker.stdout.removeListener('data', sendWorkerStdout)
      worker.stderr.removeListener('data', sendWorkerStderr)
      if (exitCode !== null) broadcast('pear:worker:exit:' + specifier, exitCode)
      workers.delete(specifier)
    }

    workers.set(specifier, runtime)
    worker.stdout.on('data', sendWorkerStdout)
    worker.stderr.on('data', sendWorkerStderr)

    worker.on('error', (err: Error) => {
      console.error(`Worker ${specifier} error:`, err)
      cleanupWorker(err, null)
    })

    worker.once('exit', (code: number) => {
      cleanupWorker(new Error(`Worker ${specifier} exited with code ${code}`), code)
    })

    app.on('before-quit', onBeforeQuit)
    return runtime
  }

  async function startWorker(specifier: string, args: string[] = []) {
    const runtime = getWorker(specifier, args)
    await runtime.ready
    return true
  }

  async function invokeWorker(specifier: string, method: TransferMethod, ...args: unknown[]) {
    if (!isTransferMethod(method)) {
      throw new Error(`Unsupported transfer method: ${String(method)}`)
    }

    const runtime = getWorker(specifier)
    return (runtime.client[method] as (...a: unknown[]) => Promise<unknown>)(...args)
  }

  function disconnectWorker(specifier: string) {
    const runtime = workers.get(specifier)
    if (runtime) {
      runtime.worker.destroy()
      workers.delete(specifier)
      return true
    }
    return false
  }

  function restartApp() {
    if (isMac) {
      app.relaunch()
    } else if (isLinux && process.env.APPIMAGE) {
      app.relaunch({
        execPath: process.env.APPIMAGE,
        args: [
          '--appimage-extract-and-run',
          ...process.argv.slice(1).filter((arg) => arg !== '--appimage-extract-and-run')
        ]
      })
    } else {
      app.relaunch()
    }

    app.exit(0)
  }

  function forwardDeepLink(url: string) {
    broadcast('app:deep-link', url)
  }

  return {
    metadata: {
      pkg,
      productName,
      protocol: productName,
      version,
      upgrade
    },
    allowMultipleInstances: cmd.flags.multi,
    getPear,
    startWorker,
    invokeWorker,
    disconnectWorker,
    restartApp,
    forwardDeepLink
  }
}
