const STREAM_PREFIX = '/_stream/'
const PENDING_TTL_MS = 30000
const pending = new Map()

self.addEventListener('install', () => self.skipWaiting())
self.addEventListener('activate', (event) => event.waitUntil(self.clients.claim()))

self.addEventListener('message', (event) => {
  const data = event.data
  if (!data || data.type !== 'stream') return
  pending.set(data.id, {
    readable: data.readable,
    filename: data.filename,
    size: data.size,
    at: Date.now()
  })
  for (const [id, entry] of pending) {
    if (Date.now() - entry.at > PENDING_TTL_MS) pending.delete(id)
  }
  if (data.port) data.port.postMessage('registered')
})

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url)
  if (url.origin !== self.location.origin || !url.pathname.startsWith(STREAM_PREFIX)) return

  const id = url.pathname.slice(STREAM_PREFIX.length)
  const entry = pending.get(id)

  if (!entry) {
    event.respondWith(new Response('stream expired', { status: 410 }))
    return
  }
  pending.delete(id)

  const headers = new Headers({
    'Content-Type': 'application/octet-stream',
    'Content-Disposition': `attachment; filename*=UTF-8''${encodeURIComponent(entry.filename)}`,
    'Content-Security-Policy': "default-src 'none'"
  })
  if (Number.isFinite(entry.size)) headers.set('Content-Length', String(entry.size))

  event.respondWith(new Response(entry.readable, { headers }))
})
