let registration: Promise<ServiceWorkerRegistration> | null = null
let transferable: boolean | null = null

function supportsTransferableStreams(): boolean {
  if (transferable !== null) return transferable
  transferable = false
  try {
    const { readable } = new TransformStream()
    const channel = new MessageChannel()
    channel.port1.postMessage(readable, [readable as unknown as Transferable])
    channel.port1.close()
    channel.port2.close()
    transferable = true
  } catch {
    transferable = false
  }
  return transferable
}

function baseSupport(): boolean {
  return (
    typeof navigator !== 'undefined' &&
    'serviceWorker' in navigator &&
    typeof window !== 'undefined' &&
    window.isSecureContext &&
    typeof TransformStream !== 'undefined' &&
    typeof MessageChannel !== 'undefined'
  )
}

export function registerStreamWorker(): void {
  if (!baseSupport() || registration) return
  registration = navigator.serviceWorker.register('/sw.js', { scope: '/' })
  registration.catch((error) => console.warn('Stream worker registration failed', error))
}

async function activeWorker(): Promise<ServiceWorker> {
  if (!registration) registerStreamWorker()
  if (!registration) throw new Error('Stream worker unsupported')
  const reg = await registration
  if (reg.active) return reg.active

  const worker = reg.installing ?? reg.waiting
  if (!worker) throw new Error('No stream worker available')

  await new Promise<void>((resolve, reject) => {
    const onChange = () => {
      if (worker.state === 'activated') {
        cleanup()
        resolve()
      }
    }
    const timer = setTimeout(() => {
      cleanup()
      reject(new Error('Stream worker activation timed out'))
    }, 2000)
    const cleanup = () => {
      clearTimeout(timer)
      worker.removeEventListener('statechange', onChange)
    }
    worker.addEventListener('statechange', onChange)
    if (worker.state === 'activated') onChange()
  })

  if (!reg.active) throw new Error('Stream worker did not activate')
  return reg.active
}

export async function streamReady(): Promise<boolean> {
  if (!baseSupport() || !supportsTransferableStreams()) return false
  try {
    registerStreamWorker()
    await activeWorker()
    return true
  } catch (error) {
    console.warn('Streaming download unavailable, falling back', error)
    return false
  }
}

export async function startStreamDownload(
  fileName: string,
  size: number
): Promise<WritableStreamDefaultWriter<Uint8Array>> {
  const worker = await activeWorker()
  const id = crypto.randomUUID()
  const transform = new TransformStream<Uint8Array, Uint8Array>()

  worker.postMessage(
    { type: 'stream', id, filename: fileName, size, readable: transform.readable },
    [transform.readable as unknown as Transferable]
  )

  const iframe = document.createElement('iframe')
  iframe.hidden = true
  iframe.src = `/_stream/${id}`
  document.body.appendChild(iframe)
  setTimeout(() => iframe.remove(), 10_000)

  return transform.writable.getWriter()
}
