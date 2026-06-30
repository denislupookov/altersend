import { describe, it, expect } from 'vitest'
import {
  getDirname,
  getFileName,
  joinFilePath,
  isPathSafe,
  isSafeFileName,
  isSafeRelativePath,
  isValidHexKey,
  shortKey,
  toRelativePath
} from './utils'

describe('getDirname', () => {
  it('returns the directory portion of a posix path', () => {
    expect(getDirname('/home/user/file.txt')).toBe('/home/user')
  })

  it('normalises windows backslashes to forward slashes', () => {
    expect(getDirname('C:\\Users\\file.txt')).toBe('C:/Users')
  })

  it('returns "." for a bare filename', () => {
    expect(getDirname('file.txt')).toBe('.')
  })

  it('returns "." for a path with only a leading slash', () => {
    expect(getDirname('/file.txt')).toBe('.')
  })
})

describe('getFileName', () => {
  it('extracts the filename from a posix path', () => {
    expect(getFileName('/home/user/file.txt')).toBe('file.txt')
  })

  it('normalises windows backslashes', () => {
    expect(getFileName('C:\\Users\\file.txt')).toBe('file.txt')
  })

  it('returns the input when there is no separator', () => {
    expect(getFileName('file.txt')).toBe('file.txt')
  })
})

describe('joinFilePath', () => {
  it('joins with a forward slash for posix paths', () => {
    expect(joinFilePath('/downloads', 'photo.jpg')).toBe('/downloads/photo.jpg')
  })

  it('joins with a backslash for windows paths', () => {
    expect(joinFilePath('C:\\Downloads', 'photo.jpg')).toBe('C:\\Downloads\\photo.jpg')
  })

  it('strips a trailing separator before joining', () => {
    expect(joinFilePath('/downloads/', 'photo.jpg')).toBe('/downloads/photo.jpg')
  })

  it('returns just the filename when dirPath is empty', () => {
    expect(joinFilePath('', 'photo.jpg')).toBe('photo.jpg')
  })
})

describe('isSafeFileName', () => {
  it('accepts a normal filename', () => {
    expect(isSafeFileName('report.pdf')).toBe(true)
  })

  it('accepts filenames with spaces and unicode', () => {
    expect(isSafeFileName('my résumé.pdf')).toBe(true)
  })

  it('rejects empty string', () => {
    expect(isSafeFileName('')).toBe(false)
  })

  it('rejects a name longer than 255 characters', () => {
    expect(isSafeFileName('a'.repeat(256))).toBe(false)
  })

  it('rejects names containing a forward slash', () => {
    expect(isSafeFileName('../../etc/passwd')).toBe(false)
  })

  it('rejects names containing a backslash', () => {
    expect(isSafeFileName('..\\secret')).toBe(false)
  })

  it('rejects "."', () => {
    expect(isSafeFileName('.')).toBe(false)
  })

  it('rejects ".."', () => {
    expect(isSafeFileName('..')).toBe(false)
  })

  it('rejects names with a NUL byte', () => {
    expect(isSafeFileName('file\0name')).toBe(false)
  })

  it('rejects non-string input', () => {
    expect(isSafeFileName(null)).toBe(false)
    expect(isSafeFileName(42)).toBe(false)
    expect(isSafeFileName(undefined)).toBe(false)
  })
})

describe('isValidHexKey', () => {
  const valid = 'a'.repeat(64)

  it('accepts 64 lowercase hex chars', () => {
    expect(isValidHexKey(valid)).toBe(true)
  })

  it('accepts uppercase hex', () => {
    expect(isValidHexKey('A'.repeat(64))).toBe(true)
  })

  it('accepts mixed case hex', () => {
    expect(isValidHexKey('aB'.repeat(32))).toBe(true)
  })

  it('rejects strings shorter than 64 chars', () => {
    expect(isValidHexKey('a'.repeat(63))).toBe(false)
  })

  it('rejects strings longer than 64 chars', () => {
    expect(isValidHexKey('a'.repeat(65))).toBe(false)
  })

  it('rejects non-hex characters', () => {
    expect(isValidHexKey('g'.repeat(64))).toBe(false)
  })

  it('rejects empty string', () => {
    expect(isValidHexKey('')).toBe(false)
  })

  it('rejects non-string input', () => {
    expect(isValidHexKey(null)).toBe(false)
    expect(isValidHexKey(undefined)).toBe(false)
    expect(isValidHexKey(42)).toBe(false)
  })
})

describe('isPathSafe', () => {
  it('accepts a normal posix path', () => {
    expect(isPathSafe('/Users/alice/Downloads/photo.jpg')).toBe(true)
  })

  it('accepts a normal windows path', () => {
    expect(isPathSafe('C:\\Users\\alice\\Downloads\\photo.jpg')).toBe(true)
  })

  it('accepts a relative path with no traversal', () => {
    expect(isPathSafe('Downloads/photo.jpg')).toBe(true)
  })

  it('rejects empty string', () => {
    expect(isPathSafe('')).toBe(false)
  })

  it('rejects non-string input', () => {
    expect(isPathSafe(null)).toBe(false)
    expect(isPathSafe(undefined)).toBe(false)
    expect(isPathSafe(42)).toBe(false)
  })

  it('rejects null-byte injection', () => {
    expect(isPathSafe('/Users/alice/file\0.txt')).toBe(false)
  })

  it('rejects posix parent traversal', () => {
    expect(isPathSafe('/Users/alice/../bob/secret.txt')).toBe(false)
  })

  it('rejects windows parent traversal', () => {
    expect(isPathSafe('C:\\Users\\alice\\..\\bob\\secret.txt')).toBe(false)
  })

  it('rejects parent traversal at the start', () => {
    expect(isPathSafe('../etc/passwd')).toBe(false)
  })

  it('rejects mixed-separator parent traversal', () => {
    expect(isPathSafe('/Users/alice\\..\\bob')).toBe(false)
  })
})

describe('isSafeRelativePath', () => {
  it('accepts a plain file name', () => {
    expect(isSafeRelativePath('report.pdf')).toBe(true)
  })

  it('accepts a nested relative path', () => {
    expect(isSafeRelativePath('Photos/2024/img.png')).toBe(true)
  })

  it('rejects a rooted POSIX path (leading slash)', () => {
    expect(isSafeRelativePath('/Photos/img.png')).toBe(false)
  })

  it('rejects a rooted Windows path (drive prefix)', () => {
    expect(isSafeRelativePath('C:\\foo\\bar')).toBe(false)
    expect(isSafeRelativePath('C:/foo/bar')).toBe(false)
    expect(isSafeRelativePath('\\\\server\\share')).toBe(false)
  })

  it('rejects empty string', () => {
    expect(isSafeRelativePath('')).toBe(false)
  })

  it('rejects a path with no real segments', () => {
    expect(isSafeRelativePath('///')).toBe(false)
  })

  it('rejects parent traversal in any segment', () => {
    expect(isSafeRelativePath('Photos/../../etc/passwd')).toBe(false)
    expect(isSafeRelativePath('..')).toBe(false)
  })

  it('rejects a current-dir segment', () => {
    expect(isSafeRelativePath('Photos/./img.png')).toBe(false)
  })

  it('rejects null-byte injection', () => {
    expect(isSafeRelativePath('Photos/img\0.png')).toBe(false)
  })

  it('rejects a segment over 255 chars', () => {
    expect(isSafeRelativePath(`Photos/${'a'.repeat(256)}.png`)).toBe(false)
  })

  it('rejects non-string input', () => {
    expect(isSafeRelativePath(null)).toBe(false)
    expect(isSafeRelativePath(42)).toBe(false)
    expect(isSafeRelativePath(undefined)).toBe(false)
  })
})

describe('toRelativePath', () => {
  it('strips a leading slash', () => {
    expect(toRelativePath('/Photos/img.png')).toBe('Photos/img.png')
  })

  it('normalizes backslashes to forward slashes', () => {
    expect(toRelativePath('\\Photos\\img.png')).toBe('Photos/img.png')
  })

  it('leaves an already-relative path unchanged', () => {
    expect(toRelativePath('img.png')).toBe('img.png')
  })
})

describe('shortKey', () => {
  it('returns the first 8 chars of a hex key', () => {
    expect(shortKey('abcdef1234567890')).toBe('abcdef12')
  })

  it('returns "(none)" for null', () => {
    expect(shortKey(null)).toBe('(none)')
  })

  it('returns "(none)" for undefined', () => {
    expect(shortKey(undefined)).toBe('(none)')
  })

  it('returns "(none)" for empty string', () => {
    expect(shortKey('')).toBe('(none)')
  })
})
