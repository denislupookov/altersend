import type { OpfsReply } from './opfsProtocol'

const PROBE_TIMEOUT_MS = 5000

let worker: Worker | null = null
let nextId = 0
const pending = new Map<
  number,
  { resolve: (reply: OpfsReply) => void; reject: (error: Error) => void }
>()

function failPending(reason: string): void {
  const entries = [...pending.values()]
  pending.clear()
  worker = null
  for (const entry of entries) entry.reject(new Error(reason))
}

function getWorker(): Worker {
  if (worker) return worker
  const created = new Worker(new URL('./opfsWorker.ts', import.meta.url), { type: 'module' })
  created.onmessage = (event: MessageEvent<OpfsReply>) => {
    const entry = pending.get(event.data.id)
    if (!entry) return
    pending.delete(event.data.id)
    if (event.data.ok) entry.resolve(event.data)
    else entry.reject(new Error(event.data.error ?? 'OPFS worker error'))
  }
  created.onerror = () => failPending('OPFS worker failed to start')
  created.onmessageerror = () => failPending('OPFS worker sent an unreadable message')
  worker = created
  return created
}

export function request(
  message: Record<string, unknown>,
  transfer?: Transferable[]
): Promise<OpfsReply> {
  const id = nextId++
  return new Promise<OpfsReply>((resolve, reject) => {
    pending.set(id, { resolve, reject })
    try {
      getWorker().postMessage({ ...message, id }, transfer ?? [])
    } catch (error) {
      pending.delete(id)
      reject(error instanceof Error ? error : new Error(String(error)))
    }
  })
}

function opfsPossible(): boolean {
  return (
    typeof Worker !== 'undefined' &&
    typeof navigator !== 'undefined' &&
    typeof navigator.storage?.getDirectory === 'function'
  )
}

export function sweepOpfs(): void {
  if (!opfsPossible()) return
  request({ type: 'sweep' }).catch((error) => console.warn('OPFS sweep failed', error))
}

let probed: Promise<boolean> | null = null

export function isOpfsSupported(): Promise<boolean> {
  if (!opfsPossible()) return Promise.resolve(false)
  if (!probed) {
    probed = new Promise<boolean>((resolve) => {
      const timer = setTimeout(() => resolve(false), PROBE_TIMEOUT_MS)
      request({ type: 'probe' })
        .then((reply) => resolve(reply.supported === true))
        .catch(() => resolve(false))
        .finally(() => clearTimeout(timer))
    })
  }
  return probed
}
