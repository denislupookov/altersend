import type { CloseMsg, OpenMsg, OpfsMsg, WriteMsg } from './opfsProtocol'

const handles = new Map<string, FileSystemSyncAccessHandle>()

async function directory(): Promise<FileSystemDirectoryHandle> {
  return navigator.storage.getDirectory()
}

async function open({ name, size }: OpenMsg): Promise<void> {
  let handle = handles.get(name)
  if (!handle) {
    const root = await directory()
    const file = await root.getFileHandle(name, { create: true })
    handle = await file.createSyncAccessHandle()
    handles.set(name, handle)
  }
  if (handle.getSize() < size) handle.truncate(size)
}

function write({ name, offset, buffer }: WriteMsg): void {
  const handle = handles.get(name)
  if (!handle) throw new Error(`No open handle for ${name}`)
  handle.write(new Uint8Array(buffer), { at: offset })
}

function finalize({ name }: CloseMsg): void {
  const handle = handles.get(name)
  if (!handle) return
  handle.flush()
  handle.close()
  handles.delete(name)
}

function abort({ name }: CloseMsg): void {
  handles.get(name)?.close()
  handles.delete(name)
}

async function discard({ name }: CloseMsg): Promise<void> {
  abort({ name } as CloseMsg)
  const root = await directory()
  await root.removeEntry(name).catch((error) => console.warn('OPFS discard failed', error))
}

async function probe(): Promise<boolean> {
  try {
    const root = await directory()
    const file = await root.getFileHandle('.opfs-probe', { create: true })
    const handle = await file.createSyncAccessHandle()
    handle.close()
    await root
      .removeEntry('.opfs-probe')
      .catch((error) => console.warn('OPFS probe cleanup failed', error))
    return true
  } catch {
    return false
  }
}

self.onmessage = (event: MessageEvent<OpfsMsg>) => {
  const msg = event.data
  const run = async (): Promise<Record<string, unknown>> => {
    if (msg.type === 'probe') return { supported: await probe() }
    if (msg.type === 'open') await open(msg)
    else if (msg.type === 'write') write(msg)
    else if (msg.type === 'finalize') finalize(msg)
    else if (msg.type === 'abort') abort(msg)
    else await discard(msg)
    return {}
  }
  run()
    .then((extra) => self.postMessage({ id: msg.id, ok: true, ...extra }))
    .catch((error: unknown) => self.postMessage({ id: msg.id, ok: false, error: String(error) }))
}
