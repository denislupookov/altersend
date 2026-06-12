import os from 'os'
import path from 'path'
import { fileURLToPath } from 'url'
import PearRuntime from 'pear-runtime'
import { type WorkerClient, type RendererTransferEvent } from '@altersend/core'
import { isMac, isLinux } from 'which-runtime'
import { createRequire } from 'module'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const _require = createRequire(import.meta.url)

export type EventCallback = (event: RendererTransferEvent) => void

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

export interface CliRuntimeInstance {
  client: WorkerClient
  destroy: () => void
}

function getWorkerEntryPath(): string {
  return path.join(__dirname, '../../node_modules/@altersend/core/dist/worklet/index.js')
}

function getWorkerClientPath(): string {
  return path.join(__dirname, '../../node_modules/@altersend/core/dist/client/worker-client.js')
}

export async function createCliRuntime(storagePath?: string, onEvent?: EventCallback): Promise<CliRuntimeInstance> {
  let dir: string
  if (storagePath) {
    dir = storagePath
  } else {
    dir = isMac
      ? path.join(os.homedir(), 'Library', 'Application Support', 'AlterSend')
      : isLinux
        ? path.join(os.homedir(), '.config', 'AlterSend')
        : path.join(os.homedir(), 'AppData', 'Local', 'AlterSend')
  }

  const pear = new PearRuntime({
    name: 'AlterSend',
    dir,
    version: '1.2.0'
  })

  const workerClientPath = getWorkerClientPath()
  const workerPath = getWorkerEntryPath()
  const { createTransferWorkerClient: createClient } = _require(workerClientPath) as {
    createTransferWorkerClient: (
      worker: WorkerHandle,
      options?: { onEvent?: (event: RendererTransferEvent) => void }
    ) => WorkerClient
  }

  const worker = pear.run(workerPath, [`--storage=${pear.storage}`])
  const client = createClient(worker, { onEvent })

  await client.ready

  return {
    client,
    destroy: () => {
      worker.destroy()
    }
  }
}