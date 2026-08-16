import { describe, expect, it } from 'vitest'
import { getReceiveStep } from './pageUi'

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
