import { EventEmitter } from 'node:events'
import b4a from 'b4a'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { attachRelayDial } from './announce'
import { configureRelay, relayThrough, setRelayRole } from './config'

const KEY_A = 'a'.repeat(64)
const KEY_B = 'b'.repeat(64)
const PEER_KEY = 'f'.repeat(64)

class FakeSocket extends EventEmitter {}

function fakeDht() {
  const sockets: FakeSocket[] = []
  const dht = {
    connect: (_publicKey: Uint8Array): unknown => {
      const socket = new FakeSocket()
      sockets.push(socket)
      return socket
    }
  }
  return { dht, sockets }
}

function hooks() {
  return { onAllRelaysBusy: vi.fn(), onPeerDial: vi.fn(), onRelayDial: vi.fn() }
}

const refused = () => Object.assign(new Error('refused'), { code: 'PEER_CONNECTION_FAILED' })
const keyHexes = (keys: Uint8Array[] | null) => keys?.map((key) => b4a.toString(key, 'hex'))

beforeEach(() => {
  configureRelay({
    enabled: true,
    relays: [
      { keyHex: KEY_A, host: '1.2.3.4' },
      { keyHex: KEY_B, host: '5.6.7.8' }
    ],
    proRelays: [],
    customRelays: [],
    customConfigured: false,
    customFallback: false,
    proToken: null
  })
  setRelayRole(null)
})

describe('attachRelayDial', () => {
  it('hands peer dials to the peer observer', () => {
    const { dht, sockets } = fakeDht()
    const h = hooks()
    attachRelayDial(dht, h)
    dht.connect(b4a.from(PEER_KEY, 'hex'))
    expect(h.onPeerDial).toHaveBeenCalledWith(sockets[0])
    expect(h.onRelayDial).not.toHaveBeenCalled()
  })

  it('reports relay dials', () => {
    const { dht } = fakeDht()
    const h = hooks()
    attachRelayDial(dht, h)
    dht.connect(b4a.from(KEY_A, 'hex'))
    expect(h.onRelayDial).toHaveBeenCalledTimes(1)
    expect(h.onPeerDial).not.toHaveBeenCalled()
  })

  it('moves on to the other relay when one cannot be reached', () => {
    const { dht, sockets } = fakeDht()
    const h = hooks()
    attachRelayDial(dht, h)
    dht.connect(b4a.from(KEY_A, 'hex'))
    sockets[0].emit('error', refused())
    expect(keyHexes(relayThrough(true))).toEqual([KEY_B])
    expect(h.onAllRelaysBusy).not.toHaveBeenCalled()
  })

  it('reports all relays busy once none can be reached', () => {
    const { dht, sockets } = fakeDht()
    const h = hooks()
    attachRelayDial(dht, h)
    dht.connect(b4a.from(KEY_A, 'hex'))
    dht.connect(b4a.from(KEY_B, 'hex'))
    sockets[0].emit('error', refused())
    sockets[1].emit('error', refused())
    expect(relayThrough(true)).toBeNull()
    expect(h.onAllRelaysBusy).toHaveBeenCalledTimes(1)
  })

  it('keeps a relay that opened even if it errors later', () => {
    const { dht, sockets } = fakeDht()
    attachRelayDial(dht, hooks())
    dht.connect(b4a.from(KEY_A, 'hex'))
    sockets[0].emit('open')
    sockets[0].emit('error', refused())
    expect(keyHexes(relayThrough(true))).toEqual([KEY_A, KEY_B])
  })
})
