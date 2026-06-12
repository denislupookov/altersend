import os from 'os'
import path from 'path'
import crypto from 'crypto'
import PearRuntime from 'pear-runtime'
import { type WorkerClient, type RendererTransferEvent } from '@altersend/core'
import { isMac, isLinux } from 'which-runtime'
import { createRequire } from 'module'

const _require = createRequire(__filename)

const pkgPath = path.join(__dirname, '..', 'package.json')
const pkg = _require(pkgPath) as { version: string; upgrade: string }

if (pkg.upgrade.includes('REPLACE_WITH')) {
  throw new Error(
    'apps/cli/package.json#upgrade is a placeholder. ' +
      'Run `npx pear init` in apps/cli/, paste the resulting pear:// link, ' +
      'then rebuild.'
  )
}

export type EventCallback = (event: RendererTransferEvent) => void

export interface CliRuntimeInstance {
  client: WorkerClient
  destroy: () => void
  pear: PearRuntime
}

function getWorkerEntryPath(): string {
  return require.resolve('@altersend/core/dist/worklet/index.js')
}

function getWorkerClientPath(): string {
  return require.resolve('@altersend/core/dist/client/worker-client.js')
}

function getDefaultStorage(): string {
  const base = isMac
    ? path.join(os.homedir(), 'Library', 'Application Support', 'AlterSend')
    : isLinux
      ? path.join(os.homedir(), '.config', 'AlterSend')
      : path.join(os.homedir(), 'AppData', 'Local', 'AlterSend')
  return base
}

function makeTempStorage(): string {
  const id = crypto.randomUUID()
  return path.join(os.tmpdir(), `altersend-${id}`)
}

export async function createCliRuntime(
  storagePath?: string,
  onEvent?: EventCallback,
  updates = true
): Promise<CliRuntimeInstance> {
  let dir = storagePath ?? getDefaultStorage()

  let pear = new PearRuntime({
    name: 'AlterSend',
    dir,
    version: pkg.version,
    upgrade: pkg.upgrade,
    updates
  })

  const workerClientPath = getWorkerClientPath()
  const workerPath = getWorkerEntryPath()
  const { createTransferWorkerClient: createClient } = _require(workerClientPath) as {
    createTransferWorkerClient: (
      worker: unknown,
      options?: { onEvent?: (event: RendererTransferEvent) => void }
    ) => WorkerClient
  }

  let worker = pear.run(workerPath, [`--storage=${pear.storage}`])
  let client = createClient(worker, { onEvent })

  try {
    await client.ready
  } catch (err) {
    worker.destroy()
    const msg = err instanceof Error ? err.message : String(err)
    if (msg.includes('LOCK') || msg.includes('lock') || msg.includes('storage')) {
      dir = makeTempStorage()
      const fallbackPear = new PearRuntime({
        name: 'AlterSend',
        dir,
        version: pkg.version,
        upgrade: pkg.upgrade,
        updates
      })
      worker = fallbackPear.run(workerPath, [`--storage=${fallbackPear.storage}`])
      client = createClient(worker, { onEvent })
      await client.ready
      pear = fallbackPear
    } else {
      throw err
    }
  }

  return {
    client,
    destroy: () => {
      worker.destroy()
    },
    pear
  }
}