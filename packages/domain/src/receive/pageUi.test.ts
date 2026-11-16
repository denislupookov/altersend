import { describe, expect, it } from 'vitest'
import { TRANSFER_ERROR_CODES } from '../transfer/types'
import {
  getConnectFailureFix,
  getConnectFailureStatus,
  getConnectingStatus,
  getConnectingStatusKey,
  getReceiveStep
} from './pageUi'

const receiving = {
  hasIncomingFiles: true,
  allDownloadsCompleted: false,
  role: 'receiver' as const,
  peerCount: 0
}

describe('getReceiveStep after the peer drops', () => {
  it('retries first, then settles by cause', () => {
    expect(getReceiveStep(receiving)).toBe('reconnecting')
    expect(getReceiveStep({ ...receiving, reconnectExhausted: true })).toBe('interrupted')
    expect(getReceiveStep({ ...receiving, sessionEndedByPeer: true })).toBe('session_ended')
    expect(getReceiveStep({ ...receiving, allDownloadsCompleted: true })).toBe('completed')
  })
})

describe('getConnectingStatus', () => {
  const t = (key: string) => key
  const connecting = {
    relayBusy: false,
    stage: 'searching' as const,
    reason: null,
    peerCount: 0
  }

  it('says it is looking for the sender first', () => {
    expect(getConnectingStatus(t, connecting)).toEqual({
      tone: 'neutral',
      active: true,
      label: 'receive:page.searching.label',
      title: 'receive:page.searching.title',
      description: 'receive:page.searching.description'
    })
  })

  it('tints the relay path blue and trouble amber', () => {
    expect(getConnectingStatus(t, { ...connecting, stage: 'relaying' }).tone).toBe('info')
    expect(getConnectingStatus(t, { ...connecting, relayBusy: true }).tone).toBe('warning')
    expect(getConnectingStatus(t, { ...connecting, peerCount: 1 }).tone).toBe('success')
  })

  it('follows the connection stage', () => {
    expect(getConnectingStatusKey({ ...connecting, stage: 'reaching' })).toBe('reaching')
    expect(getConnectingStatusKey({ ...connecting, stage: 'relaying' })).toBe('relaying')
  })

  it('falls back to searching before any stage arrives', () => {
    expect(getConnectingStatusKey({ ...connecting, stage: null })).toBe('searching')
  })

  it('explains a blocked path when the relay is off', () => {
    expect(getConnectingStatusKey({ ...connecting, reason: 'relay-off' })).toBe('relayOff')
  })

  it('says it is still trying while the relay is busy', () => {
    expect(getConnectingStatusKey({ ...connecting, relayBusy: true, reason: 'relay-off' })).toBe(
      'relayBusy'
    )
  })

  it('shows the handshake once the sender is connected', () => {
    expect(getConnectingStatusKey({ ...connecting, relayBusy: true, peerCount: 1 })).toBe(
      'handshake'
    )
  })
})

describe('getConnectFailureStatus', () => {
  const t = (key: string) => key

  it('settles on a still amber status with the failure copy', () => {
    expect(getConnectFailureStatus(t, TRANSFER_ERROR_CODES.directBlocked)).toEqual({
      tone: 'warning',
      active: false,
      label: 'receive:connectFailure.directBlocked.label',
      title: 'receive:connectFailure.directBlocked.title',
      description: 'receive:connectFailure.directBlocked.description'
    })
  })
})

describe('getConnectFailureFix', () => {
  it('points relay-off failures at the relay settings', () => {
    expect(getConnectFailureFix(TRANSFER_ERROR_CODES.relayOff, false)).toBe('relaySettings')
  })

  it('offers Pro only to free users when the relay is busy', () => {
    expect(getConnectFailureFix(TRANSFER_ERROR_CODES.relayBusy, false)).toBe('upgrade')
    expect(getConnectFailureFix(TRANSFER_ERROR_CODES.relayBusy, true)).toBeNull()
  })

  it('has no extra fix when the sender was not found', () => {
    expect(getConnectFailureFix(TRANSFER_ERROR_CODES.peerUnreachable, false)).toBeNull()
  })
})
