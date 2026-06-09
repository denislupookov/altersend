import { describe, expect, it } from 'vitest'
import { fileUriToPath } from './paths'

describe('fileUriToPath', () => {
  it('strips file URI prefix', () => {
    expect(fileUriToPath('file:///tmp/photo.jpg')).toBe('/tmp/photo.jpg')
  })

  it('decodes percent-encoded filesystem paths', () => {
    expect(fileUriToPath('file:///tmp/My%20File.jpg')).toBe('/tmp/My File.jpg')
  })

  it('preserves non-file URIs', () => {
    expect(fileUriToPath('content://media/external/file/1')).toBe('content://media/external/file/1')
  })

  it('falls back to the stripped path when URI decoding fails', () => {
    expect(fileUriToPath('file:///tmp/%E0%A4%A')).toBe('/tmp/%E0%A4%A')
  })
})
