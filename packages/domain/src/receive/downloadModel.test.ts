import { describe, it, expect } from 'vitest'
import type { IncomingFileOffer } from '@altersend/core'
import {
  groupReceiveRows,
  getFolderRowDisplay,
  linkifyText,
  type DownloadItemState
} from './downloadModel'

type FileOffer = Extract<IncomingFileOffer, { kind: 'file' }>

function offer(path: string, overrides: Partial<FileOffer> = {}): FileOffer {
  const name = path.split('/').filter(Boolean).pop() ?? path
  return {
    kind: 'file',
    id: path,
    transferId: 't1',
    name,
    path,
    size: 100,
    driveKey: 'd1',
    ...overrides
  }
}

function state(status: DownloadItemState['status'], bytes = 0): DownloadItemState {
  return { status, bytesTransferred: bytes, totalBytes: 100 }
}

describe('groupReceiveRows', () => {
  it('keeps loose files as standalone rows', () => {
    const rows = groupReceiveRows([offer('/a.txt'), offer('/b.txt')])
    expect(rows.map((r) => r.kind)).toEqual(['file', 'file'])
  })

  it('collapses files sharing a top-level folder into one row', () => {
    const rows = groupReceiveRows([
      offer('/Photos/a/img.png'),
      offer('/Photos/b/img.png'),
      offer('/Photos/c.png')
    ])
    expect(rows).toHaveLength(1)
    expect(rows[0]).toMatchObject({ kind: 'folder', name: 'Photos', totalSize: 300 })
  })

  it('preserves first-appearance order across folders and files', () => {
    const rows = groupReceiveRows([
      offer('/Photos/a.png'),
      offer('/loose.txt'),
      offer('/Docs/x.pdf'),
      offer('/Photos/b.png')
    ])
    expect(rows.map((r) => (r.kind === 'folder' ? r.name : r.offer.name))).toEqual([
      'Photos',
      'loose.txt',
      'Docs'
    ])
  })
})

describe('getFolderRowDisplay', () => {
  const offers = [offer('/Photos/a.png'), offer('/Photos/b.png')]

  it('reports saved when every file completed', () => {
    const display = getFolderRowDisplay(offers, {
      '/Photos/a.png': state('completed', 100),
      '/Photos/b.png': state('completed', 100)
    })
    expect(display.status.kind).toBe('saved')
    expect(display.isCompleted).toBe(true)
  })

  it('reports failed when any file failed', () => {
    const display = getFolderRowDisplay(offers, {
      '/Photos/a.png': state('completed', 100),
      '/Photos/b.png': state('failed')
    })
    expect(display.status.kind).toBe('failed')
  })

  it('reports progress while any file is downloading', () => {
    const display = getFolderRowDisplay(offers, {
      '/Photos/a.png': state('completed', 100),
      '/Photos/b.png': state('downloading', 50)
    })
    expect(display.status.kind).toBe('progress')
    expect(display.percent).toBe(75)
  })

  it('reports progress when some files saved but none in flight', () => {
    const display = getFolderRowDisplay(offers, {
      '/Photos/a.png': state('completed', 100)
    })
    expect(display.status.kind).toBe('progress')
    expect(display.percent).toBe(50)
    expect(display.isCompleted).toBe(false)
  })

  it('reports ready before anything starts', () => {
    const display = getFolderRowDisplay(offers, {})
    expect(display.status.kind).toBe('ready')
  })
})

describe('linkifyText', () => {
  it('splits a url from surrounding text', () => {
    const segments = linkifyText('see https://example.com now')
    expect(segments).toEqual([
      { text: 'see ' },
      { text: 'https://example.com', url: 'https://example.com' },
      { text: ' now' }
    ])
  })

  it('strips trailing punctuation from the link but keeps it as text', () => {
    const segments = linkifyText('go to https://example.com.')
    expect(segments).toEqual([
      { text: 'go to ' },
      { text: 'https://example.com', url: 'https://example.com' },
      { text: '.' }
    ])
  })

  it('handles two adjacent urls without losing the separator', () => {
    const segments = linkifyText('https://a.com https://b.com')
    expect(segments).toEqual([
      { text: 'https://a.com', url: 'https://a.com' },
      { text: ' ' },
      { text: 'https://b.com', url: 'https://b.com' }
    ])
  })

  it('returns plain text unchanged when there is no url', () => {
    expect(linkifyText('just a note')).toEqual([{ text: 'just a note' }])
  })

  it('processes adversarial punctuation runs in linear time (no ReDoS)', () => {
    // A url match containing a long run of '!' that is not at the end is the
    // classic quadratic-backtracking trigger for a `[punct]+$` regex.
    const hostile = `https://x/${'!'.repeat(200_000)}a`
    const start = Date.now()
    const segments = linkifyText(hostile)
    expect(Date.now() - start).toBeLessThan(1000)
    // Nothing is stripped because the match does not end in punctuation.
    expect(segments).toEqual([{ text: hostile, url: hostile }])
  })
})
