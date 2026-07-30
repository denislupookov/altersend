import './sodium-patch'
import b4a from 'b4a'
import crypto from 'hypercore-crypto'
import { fetchRelayLimit, findPeer, openRelay, relayReady, relayUrls } from './relay'
import { waitForOffers } from './session'
import type { ConnectHandlers, Connection } from './types'

export { connectErrorCode } from './relay'
export type { ConnectHandlers, Connection } from './types'

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
    const { dht, teardown, url } = await openRelay(remaining)
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

      const connection = await waitForOffers(dht, peer, topicHex, teardown, handlers)
      connection.maxTransferBytes = await limit
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
