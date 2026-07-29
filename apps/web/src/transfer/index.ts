import './sodium-patch'
import b4a from 'b4a'
import crypto from 'hypercore-crypto'
import { findPeer, openRelay, relayReady } from './relay'
import { waitForOffers } from './session'
import type { ConnectHandlers, Connection } from './types'

export { connectErrorCode } from './relay'
export type { ConnectHandlers, Connection } from './types'

export async function connect(
  code: string,
  handlers: ConnectHandlers,
  signal?: AbortSignal
): Promise<Connection> {
  handlers.onStatus?.('relay')

  const throwIfAborted = () => {
    if (signal?.aborted) throw new DOMException('Connect cancelled', 'AbortError')
  }
  throwIfAborted()

  const { dht, teardown } = await openRelay()
  const onAbort = () => teardown()
  signal?.addEventListener('abort', onAbort, { once: true })

  try {
    throwIfAborted()
    await relayReady(dht)
    throwIfAborted()

    const topicHex = code.trim()
    const discovery = crypto.discoveryKey(b4a.from(topicHex, 'hex'))

    handlers.onStatus?.('finding')
    const peer = await findPeer(dht, discovery)
    throwIfAborted()
    if (!peer) throw new Error('senderNotFound')

    return await waitForOffers(dht, peer, topicHex, teardown, handlers)
  } catch (err) {
    teardown()
    throw err
  } finally {
    signal?.removeEventListener('abort', onAbort)
  }
}
