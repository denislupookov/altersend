import os from 'os'
import path from 'path'
import crypto from 'crypto'
import PearRuntime from 'pear-runtime'
import { type WorkerClient, type RendererTransferEvent } from '@altersend/core'
import { isMac, isLinux } from 'which-runtime'
import { createRequire } from 'module'
import fs from 'node:fs/promises'

const _require = createRequire(__filename)

const pkgPath = path.join(__dirname, '..', 'package.json')
const pkg = _require(pkgPath) as { version: string; upgrade: string }

if (pkg.upgrade.includes('REPLACE_WITH')) {
  throw new Error(
    'apps/cli/package.json#upgrade is a placeholder. ' +
      'Run `npx pear init` in apps/cli/, paste the resulting pear:// link, ' +
      'then rebuild. See docs/CLI_RELEASING.md for details.'
  )
}

export type EventCallback = (event: RendererTransferEvent) => void

export interface CliRuntimeInstance {
  client: WorkerClient
  destroy: () => void
  pear: PearRuntime
}

function getWorkerEntryPath(): string {
  return path.join(__dirname, '../../../node_modules/@altersend/core/dist/worklet/index.js')
}

function getWorkerClientPath(): string {
  return path.join(__dirname, '../../../node_modules/@altersend/core/dist/client/worker-client.js')
}

function getDefaultStorage(): string {
  const base = isMac
    ? path.join(os.homedir(), 'Library', 'Application Support', 'AlterSend')
    : isLinux
      ? path.join(os.homedir(), '.config', 'AlterSend')
      : path.join(os.homedir(), 'AppData', 'Local', 'AlterSend')
  return base
}

async function isStorageLocked(storagePath: string): Promise<boolean> {
  try {
    const lockPath = path.join(storagePath, 'app-storage', 'core', 'db', 'LOCK')
    await fs.access(lockPath)
    return true
  } catch {
    return false
  }
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
  let dir: string
  if (storagePath) {
    dir = storagePath
  } else {
    const defaultPath = getDefaultStorage()
    const locked = await isStorageLocked(defaultPath)
    dir = locked ? makeTempStorage() : defaultPath
  }

  const pear = new PearRuntime({
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

  const worker = pear.run(workerPath, [`--storage=${pear.storage}`])
  const client = createClient(worker, { onEvent })

  await client.ready

  return {
    client,
    destroy: () => {
      worker.destroy()
    },
    pear
  }
}
