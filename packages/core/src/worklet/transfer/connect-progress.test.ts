import { EventEmitter } from 'node:events'
import { describe, expect, it } from 'vitest'
import {
  ConnectProgress,
  classifyDialError,
  watchDialOpen,
  type ConnectProgressState
} from './connect-progress'

function track(relayEnabled = true) {
  const published: ConnectProgressState[] = []
  const progress = new ConnectProgress(
    (state) => published.push(state),
    () => relayEnabled
  )
  return { progress, published }
}

const err = (code: string) => Object.assign(new Error(code), { code })

describe('classifyDialError', () => {
  it('treats hole-punch failures as a blocked direct path', () => {
    expect(classifyDialError(err('HOLEPUNCH_DOUBLE_RANDOMIZED_NATS'))).toBe('blocked')
    expect(classifyDialError(err('REMOTE_NOT_HOLEPUNCHABLE'))).toBe('blocked')
    expect(classifyDialError(err('RELAY_ABORTED'))).toBe('blocked')
  })

  it('treats a missing peer as unreachable', () => {
    expect(classifyDialError(err('PEER_NOT_FOUND'))).toBe('unreachable')
    expect(classifyDialError(err('PEER_CONNECTION_FAILED'))).toBe('unreachable')
  })

  it('ignores errors without a known code', () => {
    expect(classifyDialError(new Error('boom'))).toBeNull()
    expect(classifyDialError(err('DUPLICATE_CONNECTION'))).toBeNull()
    expect(classifyDialError(null)).toBeNull()
  })
})

describe('ConnectProgress', () => {
  it('moves from searching to reaching to relaying', () => {
    const { progress, published } = track()
    progress.attempting()
    progress.relaying()
    expect(published).toEqual([
      { stage: 'reaching', reason: null },
      { stage: 'relaying', reason: null }
    ])
  })

  it('publishes only on change', () => {
    const { progress, published } = track()
    progress.attempting()
    progress.attempting()
    expect(published).toHaveLength(1)
  })

  it('falls back to searching when the found peer cannot be reached', () => {
    const { progress, published } = track()
    progress.attempting()
    progress.failed(err('PEER_NOT_FOUND'))
    expect(published.at(-1)).toEqual({ stage: 'searching', reason: 'unreachable' })
  })

  it('reports a blocked direct path while the relay is on', () => {
    const { progress, published } = track(true)
    progress.attempting()
    progress.failed(err('HOLEPUNCH_DOUBLE_RANDOMIZED_NATS'))
    expect(published.at(-1)).toEqual({ stage: 'reaching', reason: 'blocked' })
  })

  it('reports relay-off when the direct path is blocked and the relay is off', () => {
    const { progress, published } = track(false)
    progress.attempting()
    progress.failed(err('HOLEPUNCH_ABORTED'))
    expect(published.at(-1)).toEqual({ stage: 'reaching', reason: 'relay-off' })
  })

  it('keeps a peer that answered from being reported as unreachable', () => {
    const { progress, published } = track()
    progress.attempting()
    progress.failed(err('REMOTE_NOT_HOLEPUNCHABLE'))
    progress.relaying()
    progress.failed(err('PEER_CONNECTION_FAILED'))
    expect(published.at(-1)).toEqual({ stage: 'relaying', reason: 'blocked' })
  })

  it('starts over after a reset', () => {
    const { progress, published } = track()
    progress.attempting()
    progress.reset()
    progress.attempting()
    expect(published).toEqual([
      { stage: 'reaching', reason: null },
      { stage: 'reaching', reason: null }
    ])
  })
})

describe('watchDialOpen', () => {
  it('reports errors raised before the socket opens', () => {
    const socket = new EventEmitter()
    const failures: unknown[] = []
    watchDialOpen(socket, (e) => failures.push(e))
    socket.emit('error', err('PEER_NOT_FOUND'))
    expect(failures).toHaveLength(1)
  })

  it('ignores errors after the socket opened', () => {
    const socket = new EventEmitter()
    const failures: unknown[] = []
    watchDialOpen(socket, (e) => failures.push(e))
    socket.emit('open')
    socket.emit('error', err('PEER_NOT_FOUND'))
    expect(failures).toHaveLength(0)
  })
})
