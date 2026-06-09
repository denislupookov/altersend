import { describe, it, expect } from 'vitest'
import c from 'compact-encoding'
import { encodeRPCPayload, decodeRPCPayload, encodeRPCSuccess, encodeRPCError } from './protocol'

describe('RPC frame codec dependencies', () => {
  it('provides the optionalBuffer codec required by bare-rpc request frames', () => {
    const compact = c as { optionalBuffer?: unknown }

    expect(typeof compact.optionalBuffer).toBe('object')
  })
})

describe('encodeRPCPayload', () => {
  it('serialises objects', () => {
    expect(encodeRPCPayload({ ok: true })).toBe('{"ok":true}')
  })

  it('serialises null as "null"', () => {
    expect(encodeRPCPayload(null)).toBe('null')
  })

  it('treats undefined as null', () => {
    expect(encodeRPCPayload(undefined)).toBe('null')
  })
})

describe('decodeRPCPayload', () => {
  it('decodes a JSON string', () => {
    expect(decodeRPCPayload<{ ok: boolean }>('{"ok":true}')).toEqual({ ok: true })
  })

  it('decodes a Uint8Array', () => {
    const bytes = new TextEncoder().encode('{"x":1}')
    expect(decodeRPCPayload<{ x: number }>(bytes)).toEqual({ x: 1 })
  })

  it('returns null for an empty string', () => {
    expect(decodeRPCPayload('')).toBeNull()
  })

  it('returns null for null input', () => {
    expect(decodeRPCPayload(null)).toBeNull()
  })

  it('returns null for an empty Uint8Array', () => {
    expect(decodeRPCPayload(new Uint8Array(0))).toBeNull()
  })

  it('returns null for malformed JSON', () => {
    expect(decodeRPCPayload('{not valid json')).toBeNull()
  })

  it('round-trips through encodeRPCPayload', () => {
    const payload = { transferId: 'abc', totalFiles: 3 }
    expect(decodeRPCPayload(encodeRPCPayload(payload))).toEqual(payload)
  })
})

describe('encodeRPCSuccess', () => {
  it('wraps value in ok:true envelope', () => {
    const result = JSON.parse(encodeRPCSuccess({ state: 'joined' }))
    expect(result).toEqual({ ok: true, data: { state: 'joined' } })
  })
})

describe('encodeRPCError', () => {
  it('defaults to INTERNAL_ERROR code', () => {
    const result = JSON.parse(encodeRPCError('something broke'))
    expect(result).toEqual({
      ok: false,
      error: { code: 'INTERNAL_ERROR', message: 'something broke' }
    })
  })

  it('accepts an explicit error code', () => {
    const result = JSON.parse(encodeRPCError('bad input', 'BAD_REQUEST'))
    expect(result.error.code).toBe('BAD_REQUEST')
  })
})
