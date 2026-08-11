import { describe, expect, it, beforeAll, afterAll, vi } from 'vitest'
import { existsSync, mkdtempSync, rmSync, writeFileSync, mkdirSync } from 'fs'
import { pathToFileURL } from 'url'
import os from 'os'
import path from 'path'
import { extractFilePaths, readShareManifest } from './externalFiles.js'

let root: string
let filePath: string
let dirPath: string

beforeAll(() => {
  root = mkdtempSync(path.join(os.tmpdir(), 'altersend-external-'))
  filePath = path.join(root, 'photo.jpg')
  dirPath = path.join(root, 'album')
  writeFileSync(filePath, 'x')
  mkdirSync(dirPath)
})

afterAll(() => {
  rmSync(root, { recursive: true, force: true })
})

describe('extractFilePaths', () => {
  it('keeps existing files and folders', () => {
    expect(extractFilePaths([filePath, dirPath], 'altersend', null)).toEqual([filePath, dirPath])
  })

  it('drops flags, deep links and missing paths', () => {
    const args = [
      '--no-updates',
      '--squirrel-firstrun',
      'altersend://join/abc',
      path.join(root, 'gone.jpg'),
      filePath
    ]

    expect(extractFilePaths(args, 'altersend', null)).toEqual([filePath])
  })

  it('resolves file:// URLs passed by desktop launchers', () => {
    const args = [pathToFileURL(filePath).href]

    expect(extractFilePaths(args, 'altersend', null)).toEqual([filePath])
  })

  it('never treats the app bundle itself as shared content', () => {
    const args = [dirPath, path.join(dirPath, 'nested'), filePath]

    expect(extractFilePaths(args, 'altersend', dirPath)).toEqual([filePath])
  })
})

describe('readShareManifest', () => {
  const writeManifest = (dir: string, entries: unknown): string => {
    const target = path.join(dir, 'share-1.json')
    writeFileSync(target, JSON.stringify(entries))
    return target
  }

  it('reads the shared paths and removes the manifest', () => {
    const manifest = writeManifest(dirPath, [filePath, '/tmp/other.jpg'])

    expect(readShareManifest(`altersend://share?manifest=${manifest}`, dirPath)).toEqual([
      filePath,
      '/tmp/other.jpg'
    ])
    expect(existsSync(manifest)).toBe(false)
  })

  it('refuses a manifest outside the extension container', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    const manifest = writeManifest(root, [filePath])

    expect(readShareManifest(`altersend://share?manifest=${manifest}`, dirPath)).toEqual([])
    expect(existsSync(manifest)).toBe(true)
  })

  it('ignores deep links that are not shares', () => {
    expect(readShareManifest('altersend://join/abc', dirPath)).toEqual([])
    expect(readShareManifest('altersend://share', dirPath)).toEqual([])
    expect(readShareManifest('not a url', dirPath)).toEqual([])
  })

  it('drops non-string entries', () => {
    const manifest = writeManifest(dirPath, [filePath, 42, null])

    expect(readShareManifest(`altersend://share?manifest=${manifest}`, dirPath)).toEqual([filePath])
  })
})
