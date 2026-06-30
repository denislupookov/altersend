import { describe, it, expect } from 'vitest'
import type { SelectedFile } from './draftTypes'
import { groupSelectedFiles } from './draftModel'

function file(path: string, relativePath?: string, size = 100): SelectedFile {
  const name = path.split('/').filter(Boolean).pop() ?? path
  return { name, path, size, relativePath }
}

describe('groupSelectedFiles', () => {
  it('keeps plain files (no relativePath) as standalone rows', () => {
    const rows = groupSelectedFiles([file('/tmp/a.txt'), file('/tmp/b.txt')])
    expect(rows.map((r) => r.kind)).toEqual(['file', 'file'])
  })

  it('collapses files sharing a folder into one row with summed size', () => {
    const rows = groupSelectedFiles([
      file('/tmp/Photos/a.png', 'Photos/a.png', 100),
      file('/tmp/Photos/sub/b.png', 'Photos/sub/b.png', 200)
    ])
    expect(rows).toHaveLength(1)
    expect(rows[0]).toMatchObject({ kind: 'folder', name: 'Photos', totalSize: 300 })
  })

  it('treats a single-segment relativePath as a plain file', () => {
    const rows = groupSelectedFiles([file('/tmp/a.txt', 'a.txt')])
    expect(rows[0].kind).toBe('file')
  })

  it('preserves first-appearance order across folders and files', () => {
    const rows = groupSelectedFiles([
      file('/tmp/Photos/a.png', 'Photos/a.png'),
      file('/tmp/loose.txt'),
      file('/tmp/Photos/b.png', 'Photos/b.png')
    ])
    expect(rows.map((r) => (r.kind === 'folder' ? r.name : r.file.name))).toEqual([
      'Photos',
      'loose.txt'
    ])
  })

  it('keeps two same-named folders from different source paths as separate rows', () => {
    const rows = groupSelectedFiles([
      file('/Users/d/Desktop/Photos/a.png', 'Photos/a.png'),
      file('/Users/d/Work/Photos/b.png', 'Photos/b.png')
    ])
    expect(rows).toHaveLength(2)
    expect(rows.every((r) => r.kind === 'folder' && r.name === 'Photos')).toBe(true)
  })
})
