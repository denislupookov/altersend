import './sodium-patch'
import b4a from 'b4a'
import crypto from 'hypercore-crypto'
import { fetchRelayLimit, findPeer, openRelay, relayReady, relayUrls } from './relay'
import { waitForOffers } from './session'
import type { ConnectHandlers, Connection } from './types'

export { connectErrorCode } from './relay'
export type { ConnectHandlers, Connection } from './types'

const LIMIT_RECHECK_MS = [1500, 4000, 9000]

function watchRelayLimit(
  url: string,
  cid: string,
  connection: Connection,
  handlers: ConnectHandlers,
  signal?: AbortSignal
): void {
  const timers = LIMIT_RECHECK_MS.map((delay) =>
    setTimeout(() => {
      if (signal?.aborted) return
      fetchRelayLimit(url, cid)
        .then((bytes) => {
          if (signal?.aborted) return
          if (bytes === null || bytes <= (connection.maxTransferBytes ?? 0)) return
          connection.maxTransferBytes = bytes
          handlers.onLimit?.(bytes)
        })
        .catch((err) => console.warn('Relay limit re-check failed', err))
    }, delay)
  )

  signal?.addEventListener('abort', () => {
    for (const timer of timers) clearTimeout(timer)
  })
}

export async function connect(
  code: string,
  handlers: ConnectHandlers,
  signal?: AbortSignal
): Promise<Connection> {
  const throwIfAborted = () => {
    if (signal?.aborted) throw new DOMException('Connect cancelled', 'AbortError')
  }
  throwIfAborted()

  const topicHex = code.trim()
  const discovery = crypto.discoveryKey(b4a.from(topicHex, 'hex'))
  const urls = relayUrls()
  const tried = new Set<string>()
  let lastError: unknown = new Error('relayUnreachable')

  while (tried.size < urls.length) {
    throwIfAborted()
    handlers.onStatus?.('relay')
    const remaining = urls.filter((candidate) => !tried.has(candidate))
    const { dht, teardown, url, cid } = await openRelay(remaining)
    tried.add(url)
    const onAbort = () => teardown()
    signal?.addEventListener('abort', onAbort, { once: true })

    try {
      throwIfAborted()
      const limit = fetchRelayLimit(url)
      await relayReady(dht)
      throwIfAborted()

      handlers.onStatus?.('finding')
      const peer = await findPeer(dht, discovery)
      throwIfAborted()
      if (!peer) throw new Error('senderNotFound')

      const connection = await waitForOffers(dht, peer, topicHex, teardown, handlers, {
        cid,
        host: url
      })
      connection.maxTransferBytes = await limit

      watchRelayLimit(url, cid, connection, handlers, signal)
      return connection
    } catch (err) {
      teardown()
      if (signal?.aborted) throw err
      lastError = err
      if (tried.size < urls.length) console.warn('Relay attempt failed, trying next', url, err)
    } finally {
      signal?.removeEventListener('abort', onAbort)
    }
  }

  throw lastError
}
