import os from 'os'
import path from 'path'
import PearRuntime from 'pear-runtime'
import { type WorkerClient, type RendererTransferEvent } from '@altersend/core'
import { isMac, isLinux } from 'which-runtime'
import { createRequire } from 'module'

const _require = createRequire(__filename)

export type EventCallback = (event: RendererTransferEvent) => void

export interface CliRuntimeInstance {
  client: WorkerClient
  destroy: () => void
}

function getWorkerEntryPath(): string {
  return path.join(__dirname, '../../../node_modules/@altersend/core/dist/worklet/index.js')
}

function getWorkerClientPath(): string {
  return path.join(__dirname, '../../../node_modules/@altersend/core/dist/client/worker-client.js')
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
    version: '1.2.0',
    upgrade: 'pear://REDACTED_KEY',
    updates: false
  })

  const workerClientPath = getWorkerClientPath()
  const workerPath = getWorkerEntryPath()
  const { createTransferWorkerClient: createClient } = _require(workerClientPath) as {
    createTransferWorkerClient: (
      worker: unknown,
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