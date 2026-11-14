import { describe, expect, it } from 'vitest'
import type { IncomingFileOffer } from '@altersend/core'
import { NATIVE_RELAY_MAX_BYTES } from '../constants/transfer'
import { exceedsFreeRelay, isReceiveRelayLimited, isSendRelayLimited } from './relayLimit'

const PEER = 'peer-a'
const OVER = NATIVE_RELAY_MAX_BYTES + 1

function offer(size: number): IncomingFileOffer {
  return { id: 'f1', transferId: 't1', name: 'big.mov', path: 'big.mov', size, kind: 'file' }
}

function receiveState(overrides: Partial<Parameters<typeof isReceiveRelayLimited>[0]> = {}) {
  return {
    transferPeerKey: PEER,
    incomingFileOffers: [offer(OVER)],
    connectionTypes: { [PEER]: 'relay' as const },
    proPeers: {},
    ...overrides
  }
}

function sendState(overrides: Partial<Parameters<typeof isSendRelayLimited>[0]> = {}) {
  return {
    connectedPeers: { [PEER]: { peerKey: PEER, connectedAt: 1 } },
    connectionTypes: { [PEER]: 'relay' as const },
    proPeers: {},
    ...overrides
  }
}

describe('exceedsFreeRelay', () => {
  it('allows up to 1 GB for free', () => {
    expect(exceedsFreeRelay(NATIVE_RELAY_MAX_BYTES, false)).toBe(false)
    expect(exceedsFreeRelay(OVER, false)).toBe(true)
  })

  it('never limits Pro', () => {
    expect(exceedsFreeRelay(OVER * 100, true)).toBe(false)
  })
})

describe('isReceiveRelayLimited', () => {
  it('blocks a relayed transfer over 1 GB when neither side has Pro', () => {
    expect(isReceiveRelayLimited(receiveState(), false)).toBe(true)
  })

  it('lets a direct connection through at any size', () => {
    expect(
      isReceiveRelayLimited(receiveState({ connectionTypes: { [PEER]: 'direct' } }), false)
    ).toBe(false)
  })

  it('lets the transfer through when the receiver has Pro', () => {
    expect(isReceiveRelayLimited(receiveState(), true)).toBe(false)
  })

  it('lets the transfer through when the sender has Pro', () => {
    expect(isReceiveRelayLimited(receiveState({ proPeers: { [PEER]: true } }), false)).toBe(false)
  })

  it('allows small relayed transfers', () => {
    expect(isReceiveRelayLimited(receiveState({ incomingFileOffers: [offer(1024)] }), false)).toBe(
      false
    )
  })

  it('does nothing before a sender is known', () => {
    expect(isReceiveRelayLimited(receiveState({ transferPeerKey: null }), false)).toBe(false)
  })
})

describe('isSendRelayLimited', () => {
  it('flags a relayed receiver without Pro', () => {
    expect(isSendRelayLimited(sendState(), OVER, false)).toBe(true)
  })

  it('ignores receivers that already left', () => {
    const state = sendState({
      connectedPeers: { [PEER]: { peerKey: PEER, connectedAt: 1, disconnectedAt: 2 } }
    })
    expect(isSendRelayLimited(state, OVER, false)).toBe(false)
  })

  it('lets a Pro receiver through', () => {
    expect(isSendRelayLimited(sendState({ proPeers: { [PEER]: true } }), OVER, false)).toBe(false)
  })

  it('lets a Pro sender through', () => {
    expect(isSendRelayLimited(sendState(), OVER, true)).toBe(false)
  })
})
