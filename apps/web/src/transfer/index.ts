import './sodium-patch'
import b4a from 'b4a'
import crypto from 'hypercore-crypto'
import { findPeer, openRelay, relayReady } from './relay'
import { waitForOffers } from './session'
import type { ConnectHandlers, Connection } from './types'

export { connectErrorCode } from './relay'
export type { ConnectHandlers, ConnectStage, Connection } from './types'

export async function connect(code: string, handlers: ConnectHandlers): Promise<Connection> {
  handlers.onStatus?.('relay')

  const { dht, teardown } = openRelay()

  try {
    await relayReady(dht)

    const topicHex = code.trim()
    const discovery = crypto.discoveryKey(b4a.from(topicHex, 'hex'))

    handlers.onStatus?.('finding')
    const peer = await findPeer(dht, discovery)
    if (!peer) throw new Error('senderNotFound')

    return await waitForOffers(dht, peer, topicHex, teardown, handlers)
  } catch (err) {
    teardown()
    throw err
  }
}
