import { describe, it, expect } from 'vitest'
import { isValidControlMessage } from './control-validation'
import { PROTOCOL_VERSION } from './control-channel'

const base = { protocolVersion: PROTOCOL_VERSION }

const validFileOffer = {
  id: 'file-1',
  transferId: 'transfer-1',
  name: 'photo.jpg',
  path: '/photo.jpg',
  size: 1024,
  driveKey: 'abc123',
  kind: 'file'
}

describe('isValidControlMessage', () => {
  it('rejects null', () => {
    expect(isValidControlMessage(null)).toBe(false)
  })

  it('rejects non-objects', () => {
    expect(isValidControlMessage('string')).toBe(false)
    expect(isValidControlMessage(42)).toBe(false)
  })

  it('rejects unknown message types', () => {
    expect(isValidControlMessage({ ...base, type: 'unknown-type' })).toBe(false)
  })

  it('rejects messages with wrong protocol version', () => {
    expect(
      isValidControlMessage({
        protocolVersion: 0,
        type: 'transfer-start',
        transferId: 'x',
        totalFiles: 1,
        totalBytes: 100
      })
    ).toBe(false)
  })

  describe('transfer-start', () => {
    const valid = {
      ...base,
      type: 'transfer-start',
      transferId: 'abc',
      totalFiles: 2,
      totalBytes: 500
    }

    it('accepts a valid message', () => {
      expect(isValidControlMessage(valid)).toBe(true)
    })

    it('rejects missing transferId', () => {
      const { transferId: _, ...rest } = valid
      expect(isValidControlMessage(rest)).toBe(false)
    })

    it('rejects negative totalFiles', () => {
      expect(isValidControlMessage({ ...valid, totalFiles: -1 })).toBe(false)
    })

    it('rejects non-integer totalBytes', () => {
      expect(isValidControlMessage({ ...valid, totalBytes: 1.5 })).toBe(false)
    })
  })

  describe('transfer-ready', () => {
    const valid = { ...base, type: 'transfer-ready', transferId: 'abc', files: [validFileOffer] }

    it('accepts a valid message', () => {
      expect(isValidControlMessage(valid)).toBe(true)
    })

    it('accepts an empty files array', () => {
      expect(isValidControlMessage({ ...valid, files: [] })).toBe(true)
    })

    it('rejects when files is not an array', () => {
      expect(isValidControlMessage({ ...valid, files: 'not-an-array' })).toBe(false)
    })

    it('rejects a file offer with a path-traversal name', () => {
      const badOffer = { ...validFileOffer, name: '../../etc/passwd' }
      expect(isValidControlMessage({ ...valid, files: [badOffer] })).toBe(false)
    })

    it('rejects a file offer with an empty name', () => {
      const badOffer = { ...validFileOffer, name: '' }
      expect(isValidControlMessage({ ...valid, files: [badOffer] })).toBe(false)
    })

    it('rejects a file offer with a negative size', () => {
      const badOffer = { ...validFileOffer, size: -1 }
      expect(isValidControlMessage({ ...valid, files: [badOffer] })).toBe(false)
    })
  })

  describe('download-request', () => {
    const valid = {
      ...base,
      type: 'download-request',
      transferId: 'abc',
      fileId: 'f1',
      fileName: 'photo.jpg',
      path: '/photo.jpg',
      totalBytes: 1024
    }

    it('accepts a valid message', () => {
      expect(isValidControlMessage(valid)).toBe(true)
    })

    it('rejects empty fileName', () => {
      expect(isValidControlMessage({ ...valid, fileName: '' })).toBe(false)
    })

    it('rejects fileName with path traversal', () => {
      expect(isValidControlMessage({ ...valid, fileName: '../etc/passwd' })).toBe(false)
    })

    it('rejects missing fileId', () => {
      const { fileId: _, ...rest } = valid
      expect(isValidControlMessage(rest)).toBe(false)
    })
  })

  describe('download-progress', () => {
    const valid = {
      ...base,
      type: 'download-progress',
      transferId: 'abc',
      fileId: 'f1',
      fileName: 'photo.jpg',
      bytesTransferred: 512,
      totalBytes: 1024
    }

    it('accepts a valid message', () => {
      expect(isValidControlMessage(valid)).toBe(true)
    })

    it('accepts bytesTransferred of 0', () => {
      expect(isValidControlMessage({ ...valid, bytesTransferred: 0 })).toBe(true)
    })

    it('rejects negative bytesTransferred', () => {
      expect(isValidControlMessage({ ...valid, bytesTransferred: -1 })).toBe(false)
    })
  })

  describe('download-complete', () => {
    const valid = {
      ...base,
      type: 'download-complete',
      transferId: 'abc',
      fileId: 'f1',
      fileName: 'photo.jpg',
      savedTo: '/downloads/photo.jpg'
    }

    it('accepts a valid message', () => {
      expect(isValidControlMessage(valid)).toBe(true)
    })

    it('rejects missing savedTo', () => {
      const { savedTo: _, ...rest } = valid
      expect(isValidControlMessage(rest)).toBe(false)
    })
  })

  describe('download-failed', () => {
    const valid = {
      ...base,
      type: 'download-failed',
      transferId: 'abc',
      fileId: 'f1',
      fileName: 'photo.jpg',
      message: 'disk full'
    }

    it('accepts a valid message', () => {
      expect(isValidControlMessage(valid)).toBe(true)
    })

    it('rejects empty message', () => {
      expect(isValidControlMessage({ ...valid, message: '' })).toBe(false)
    })
  })

  describe('pairing-info', () => {
    const valid = {
      ...base,
      type: 'pairing-info',
      devicePubkey: 'a'.repeat(64),
      displayName: "Denis's MacBook",
      deviceType: 'laptop',
      capabilities: { canBackground: false },
      signature: 'a'.repeat(128)
    }

    it('accepts a valid message', () => {
      expect(isValidControlMessage(valid)).toBe(true)
    })

    it('rejects a non-hex or wrong-length pubkey', () => {
      expect(isValidControlMessage({ ...valid, devicePubkey: 'xyz' })).toBe(false)
      expect(isValidControlMessage({ ...valid, devicePubkey: 'a'.repeat(63) })).toBe(false)
    })

    it('rejects a missing or wrong-length signature', () => {
      const { signature: _signature, ...rest } = valid
      expect(isValidControlMessage(rest)).toBe(false)
      expect(isValidControlMessage({ ...valid, signature: 'a'.repeat(64) })).toBe(false)
    })

    it('rejects an unknown device type', () => {
      expect(isValidControlMessage({ ...valid, deviceType: 'toaster' })).toBe(false)
    })

    it('rejects an empty display name', () => {
      expect(isValidControlMessage({ ...valid, displayName: '' })).toBe(false)
    })

    it('rejects malformed capabilities', () => {
      expect(isValidControlMessage({ ...valid, capabilities: undefined })).toBe(false)
      expect(isValidControlMessage({ ...valid, capabilities: { canBackground: 'yes' } })).toBe(
        false
      )
    })
  })

  describe('remember-vote', () => {
    const valid = {
      ...base,
      type: 'remember-vote',
      transferId: 'transfer-1',
      vote: 'remember',
      isMine: true
    }

    it('accepts a valid message', () => {
      expect(isValidControlMessage(valid)).toBe(true)
      expect(isValidControlMessage({ ...valid, vote: 'no', isMine: false })).toBe(true)
    })

    it('rejects an unknown vote value', () => {
      expect(isValidControlMessage({ ...valid, vote: 'maybe' })).toBe(false)
    })

    it('rejects a non-boolean isMine or empty transferId', () => {
      expect(isValidControlMessage({ ...valid, isMine: 'yes' })).toBe(false)
      expect(isValidControlMessage({ ...valid, transferId: '' })).toBe(false)
    })
  })
})
