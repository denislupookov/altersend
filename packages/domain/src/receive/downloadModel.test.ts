import { describe, it, expect } from 'vitest'
import type { IncomingFileOffer } from '@altersend/core'
import {
  groupReceiveRows,
  applyDownloadMessage,
  getDownloadTotals,
  getFolderRowDisplay,
  getFolderTransferRate,
  getDownloadRowAction,
  getDownloadRowDisplay,
  getActiveDownloadProgress,
  isResumable,
  canStopDownload,
  getFolderRowAction,
  getPrimaryDownloadAction,
  getPrimaryDownloadLabel,
  markDownloadsQueued,
  type DownloadItemState
} from './downloadModel'
import { linkifyText } from './linkifyText'

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

describe('getDownloadRowDisplay resumability', () => {
  const failedAt = (resumable: boolean): DownloadItemState => ({
    status: 'failed',
    bytesTransferred: 45,
    totalBytes: 100,
    message: 'Peer disconnected',
    resumable
  })

  it('shows a resumable failure as paused, keeping the progress it reached', () => {
    const row = getDownloadRowDisplay(offer('/a.bin'), failedAt(true))

    expect(row.status.kind).toBe('paused')
    expect(row.progressPercent).toBe(45)
    expect(row.isCompleted).toBe(false)
  })

  it('shows a non-resumable failure as failed', () => {
    expect(getDownloadRowDisplay(offer('/a.bin'), failedAt(false)).status.kind).toBe('failed')
  })
})

describe('queued rows', () => {
  it('shows waiting only while another file is transferring', () => {
    expect(getDownloadRowDisplay(offer('/a.bin'), undefined, true).status.kind).toBe('waiting')
    expect(getDownloadRowDisplay(offer('/a.bin'), undefined, false).status.kind).toBe('ready')
  })

  it('treats only a resumable failure with a saved path as resumable', () => {
    const base = { status: 'failed' as const, bytesTransferred: 1, totalBytes: 2 }
    expect(isResumable({ ...base, resumable: true, savedTo: '/out.bin' })).toBe(true)
    expect(isResumable({ ...base, resumable: true })).toBe(false)
    expect(isResumable({ ...base, savedTo: '/out.bin' })).toBe(false)
    expect(isResumable(undefined)).toBe(false)
  })
})

describe('paused files in aggregates', () => {
  const paused: DownloadItemState = {
    status: 'failed',
    bytesTransferred: 45,
    totalBytes: 100,
    savedTo: '/out/a.bin',
    resumable: true
  }
  const broken: DownloadItemState = { status: 'failed', bytesTransferred: 0, totalBytes: 100 }

  it('keeps a paused file bytes in the totals so progress cannot run backwards', () => {
    const offers = [offer('/a.bin')]
    const active = getDownloadTotals(offers, {
      '/a.bin': { status: 'downloading', bytesTransferred: 45, totalBytes: 100 }
    })
    const stopped = getDownloadTotals(offers, { '/a.bin': paused })

    expect(stopped.bytesTransferred).toBe(active.bytesTransferred)
  })

  it('shows a folder with a paused child as paused, not failed', () => {
    const offers = [offer('/d/a.bin'), offer('/d/b.bin')]
    const row = getFolderRowDisplay(offers, { '/d/a.bin': paused })

    expect(row.status.kind).toBe('paused')
  })

  it('still shows a folder as failed when a child failed unrecoverably', () => {
    const offers = [offer('/d/a.bin'), offer('/d/b.bin')]
    const row = getFolderRowDisplay(offers, { '/d/a.bin': broken })

    expect(row.status.kind).toBe('failed')
  })
})

describe('resuming state', () => {
  const paused: DownloadItemState = {
    status: 'failed',
    bytesTransferred: 90,
    totalBytes: 100,
    savedTo: '/out/a.bin',
    resumable: true
  }

  it('keeps the progress it had instead of flashing back to zero', () => {
    const next = applyDownloadMessage({ '/a.bin': paused }, '/a.bin', {
      type: 'status',
      state: 'downloading',
      fileId: '/a.bin',
      totalBytes: 100,
      bytesTransferred: 0
    })

    expect(next['/a.bin'].bytesTransferred).toBe(90)
    expect(getDownloadRowDisplay(offer('/a.bin'), next['/a.bin']).status.kind).toBe('resuming')
  })

  it('switches to live progress once real bytes arrive', () => {
    const started = applyDownloadMessage({ '/a.bin': paused }, '/a.bin', {
      type: 'status',
      state: 'downloading',
      fileId: '/a.bin',
      totalBytes: 100,
      bytesTransferred: 0
    })
    const next = applyDownloadMessage(started, '/a.bin', {
      type: 'status',
      state: 'download-progress',
      fileId: '/a.bin',
      totalBytes: 100,
      bytesTransferred: 95
    })

    expect(next['/a.bin'].bytesTransferred).toBe(95)
    expect(getDownloadRowDisplay(offer('/a.bin'), next['/a.bin']).status.kind).toBe('progress')
  })
})

describe('queued downloads', () => {
  const paused: DownloadItemState = {
    status: 'failed',
    bytesTransferred: 50,
    totalBytes: 100,
    resumable: true,
    savedTo: '/dl/a.bin'
  }

  it('shows a queued paused file as waiting, not paused', () => {
    const file = offer('/a.bin')
    expect(getDownloadRowDisplay(file, paused).status.kind).toBe('paused')
    expect(getDownloadRowDisplay(file, { ...paused, queued: true }).status.kind).toBe('waiting')
  })

  it('shows a queued idle file as waiting even before anything is active', () => {
    const file = offer('/a.bin')
    const idle: DownloadItemState = { status: 'idle', bytesTransferred: 0, totalBytes: 100 }
    expect(getDownloadRowDisplay(file, idle).status.kind).toBe('ready')
    expect(getDownloadRowDisplay(file, { ...idle, queued: true }).status.kind).toBe('waiting')
  })

  it('marks and unmarks only the requested keys, skipping active downloads', () => {
    const states: Record<string, DownloadItemState> = {
      a: { ...paused },
      b: { status: 'downloading', bytesTransferred: 10, totalBytes: 100 },
      c: { status: 'idle', bytesTransferred: 0, totalBytes: 100 }
    }
    const marked = markDownloadsQueued(states, ['a', 'b'], true)
    expect(marked.a.queued).toBe(true)
    expect(marked.b.queued).toBeUndefined()
    expect(marked.c.queued).toBeUndefined()

    const cleared = markDownloadsQueued(marked, ['a', 'b'], false)
    expect(cleared.a.queued).toBeUndefined()
  })

  it('clears queued once the download actually starts', () => {
    const next = applyDownloadMessage({ a: { ...paused, queued: true } }, 'a', {
      state: 'downloading',
      fileId: 'a',
      bytesTransferred: 50,
      totalBytes: 100
    } as never)
    expect(next.a.queued).toBeUndefined()
    expect(next.a.status).toBe('downloading')
  })
})

describe('pause capability', () => {
  it('is only set when the transfer announces it', () => {
    const legacy = applyDownloadMessage({}, 'a', {
      state: 'downloading',
      fileId: 'a',
      bytesTransferred: 1,
      totalBytes: 100
    } as never)
    expect(legacy.a.pausable).toBeUndefined()

    const drive = applyDownloadMessage({}, 'a', {
      state: 'downloading',
      fileId: 'a',
      pausable: true,
      bytesTransferred: 1,
      totalBytes: 100
    } as never)
    expect(drive.a.pausable).toBe(true)
  })

  it('survives later progress events that omit the flag', () => {
    const first = applyDownloadMessage({}, 'a', {
      state: 'downloading',
      fileId: 'a',
      pausable: true,
      bytesTransferred: 1,
      totalBytes: 100
    } as never)
    const later = applyDownloadMessage(first, 'a', {
      state: 'downloading',
      fileId: 'a',
      bytesTransferred: 50,
      totalBytes: 100
    } as never)
    expect(later.a.pausable).toBe(true)
  })
})

describe('folder actions', () => {
  const active: DownloadItemState = {
    status: 'downloading',
    bytesTransferred: 10,
    totalBytes: 100,
    pausable: true
  }
  const queued: DownloadItemState = {
    status: 'idle',
    bytesTransferred: 0,
    totalBytes: 100,
    queued: true
  }
  const paused: DownloadItemState = {
    status: 'failed',
    bytesTransferred: 50,
    totalBytes: 100,
    resumable: true,
    savedTo: '/dl/a.bin'
  }
  const done: DownloadItemState = { status: 'completed', bytesTransferred: 100, totalBytes: 100 }

  it('stops a queued file even though it never announced pausable', () => {
    expect(canStopDownload(queued)).toBe(true)
    expect(canStopDownload(active)).toBe(true)
    expect(canStopDownload(done)).toBe(false)
    expect(canStopDownload(paused)).toBe(false)
  })

  it('will not stop a legacy download that cannot be resumed', () => {
    const legacy: DownloadItemState = {
      status: 'downloading',
      bytesTransferred: 5,
      totalBytes: 100
    }
    expect(canStopDownload(legacy)).toBe(false)
  })

  it('offers pause while any child is running or waiting', () => {
    const offers = [offer('/f/a.bin'), offer('/f/b.bin')]
    const states = { '/f/a.bin': done, '/f/b.bin': queued }
    expect(getFolderRowAction(offers, states)).toBe('pause')
  })

  it('offers resume once every child has stopped', () => {
    const offers = [offer('/f/a.bin'), offer('/f/b.bin')]
    const states = { '/f/a.bin': done, '/f/b.bin': paused }
    expect(getFolderRowAction(offers, states)).toBe('resume')
  })

  it('offers nothing when the folder is finished', () => {
    const offers = [offer('/f/a.bin')]
    expect(getFolderRowAction(offers, { '/f/a.bin': done })).toBe(null)
  })
})

describe('primary download action', () => {
  const base = {
    hasFiles: true,
    allDownloaded: false,
    peerCount: 1,
    isDownloading: false,
    canResumeAll: false
  }

  it('offers resume-all when every incomplete file is paused', () => {
    expect(getPrimaryDownloadAction({ ...base, canResumeAll: true })).toBe('resume-all')
  })

  it('shows progress while downloading, even if some are paused', () => {
    expect(getPrimaryDownloadAction({ ...base, isDownloading: true, canResumeAll: true })).toBe(
      'downloading'
    )
  })

  it('hides itself with no peer, no files, or nothing left to do', () => {
    expect(getPrimaryDownloadAction({ ...base, peerCount: 0 })).toBe(null)
    expect(getPrimaryDownloadAction({ ...base, hasFiles: false })).toBe(null)
    expect(getPrimaryDownloadAction({ ...base, allDownloaded: true })).toBe(null)
  })

  it('falls back to download-all', () => {
    expect(getPrimaryDownloadAction(base)).toBe('download-all')
  })
})

describe('open action on saved files', () => {
  const file = offer('/a.bin')

  it('offers open once a file is saved', () => {
    const state: DownloadItemState = {
      status: 'completed',
      bytesTransferred: 100,
      totalBytes: 100,
      savedTo: '/dl/a.bin'
    }
    const row = getDownloadRowDisplay(file, state)
    expect(getDownloadRowAction(row, state)).toEqual({ kind: 'open', savedTo: '/dl/a.bin' })
  })

  it('offers nothing when the save path is unknown', () => {
    const state: DownloadItemState = {
      status: 'completed',
      bytesTransferred: 100,
      totalBytes: 100
    }
    expect(getDownloadRowAction(getDownloadRowDisplay(file, state), state)).toBe(null)
  })

  it('still prefers resume for a paused file', () => {
    const state: DownloadItemState = {
      status: 'failed',
      bytesTransferred: 50,
      totalBytes: 100,
      resumable: true,
      savedTo: '/dl/a.bin'
    }
    expect(getDownloadRowAction(getDownloadRowDisplay(file, state), state)).toEqual({
      kind: 'resume',
      targetPath: '/dl/a.bin'
    })
  })
})

describe('primary button label', () => {
  const t = ((key: string, vars?: Record<string, unknown>) =>
    vars ? `${key}:${Object.values(vars).join(',')}` : key) as never

  it('shows progress while downloading', () => {
    expect(getPrimaryDownloadLabel(t, 'downloading', { percent: 42 })).toBe(
      'receive:actions.downloadingPercent:42'
    )
  })

  it('shows resume-all when everything is paused', () => {
    expect(getPrimaryDownloadLabel(t, 'resume-all', { percent: 0 })).toBe(
      'receive:actions.resumeAll'
    )
  })

  it('adds the size only when one is given', () => {
    expect(getPrimaryDownloadLabel(t, 'download-all', { percent: 0 })).toBe(
      'receive:actions.downloadAll'
    )
    expect(getPrimaryDownloadLabel(t, 'download-all', { percent: 0, totalBytes: 1024 })).toBe(
      'receive:actions.downloadAllWithSize:1.0 KB'
    )
  })
})

describe('stopping a download that never started', () => {
  const queued: DownloadItemState = {
    status: 'downloading',
    bytesTransferred: 0,
    totalBytes: 100,
    queued: true
  }

  const stop = (state: DownloadItemState, cancelled: boolean) =>
    applyDownloadMessage({ '/a.bin': state }, '/a.bin', {
      type: 'status',
      state: 'download-failed',
      fileId: '/a.bin',
      totalBytes: 100,
      message: 'Cancelled',
      cancelled,
      resumable: state.bytesTransferred > 0
    })

  it('returns to not-started instead of reporting a failure', () => {
    const next = stop(queued, true)

    expect(next['/a.bin'].status).toBe('idle')
    expect(next['/a.bin'].message).toBeUndefined()
    expect(getDownloadRowDisplay(offer('/a.bin'), next['/a.bin']).status.kind).not.toBe('failed')
  })

  it('still reports a genuine failure as failed', () => {
    const next = stop(queued, false)

    expect(next['/a.bin'].status).toBe('failed')
    expect(getDownloadRowDisplay(offer('/a.bin'), next['/a.bin']).status.kind).toBe('failed')
  })

  it('keeps a part-downloaded stop resumable', () => {
    const next = stop({ ...queued, bytesTransferred: 40, savedTo: '/out/a.bin' }, true)

    expect(next['/a.bin'].status).toBe('failed')
    expect(getDownloadRowDisplay(offer('/a.bin'), next['/a.bin']).status.kind).toBe('paused')
  })
})

describe('transfer rate on rows', () => {
  const file = offer('/a.bin')

  it('reports the rate separately from the transferred bytes', () => {
    const row = getDownloadRowDisplay(file, state('downloading', 40), true, '2.0 MB/s · 30s left')
    expect(row.description).toBe('40 B / 100 B')
    expect(row.rateLabel).toBe('2.0 MB/s · 30s left')
  })

  it('leaves the rate unset when none was measured', () => {
    const row = getDownloadRowDisplay(file, state('downloading', 40), true)
    expect(row.description).toBe('40 B / 100 B')
    expect(row.rateLabel).toBeUndefined()
  })

  it('omits the rate on paused rows', () => {
    const paused: DownloadItemState = {
      status: 'failed',
      bytesTransferred: 40,
      totalBytes: 100,
      resumable: true,
      savedTo: '/tmp/a.bin'
    }
    expect(getDownloadRowDisplay(file, paused, false, '2.0 MB/s').rateLabel).toBeUndefined()
  })

  it('reports the rate on folder rows with files in flight', () => {
    const offers = [offer('/Photos/a.png'), offer('/Photos/b.png')]
    const row = getFolderRowDisplay(
      offers,
      { '/Photos/a.png': state('completed', 100), '/Photos/b.png': state('downloading', 50) },
      '4.0 MB/s · 10s left'
    )
    expect(row.description).toBe('150 B / 200 B')
    expect(row.rateLabel).toBe('4.0 MB/s · 10s left')
  })

  it('omits the rate on folder rows with nothing in flight', () => {
    const offers = [offer('/Photos/a.png'), offer('/Photos/b.png')]
    const row = getFolderRowDisplay(
      offers,
      { '/Photos/a.png': state('completed', 100) },
      '4.0 MB/s'
    )
    expect(row.rateLabel).toBeUndefined()
  })
})

describe('getActiveDownloadProgress', () => {
  it('tracks only downloading files with a known size', () => {
    expect(
      getActiveDownloadProgress({
        '/a.bin': state('downloading', 40),
        '/b.bin': state('completed', 100),
        '/c.bin': { status: 'downloading', bytesTransferred: 10, totalBytes: 0 }
      })
    ).toEqual({ '/a.bin': { bytesTransferred: 40, totalBytes: 100 } })
  })
})

describe('getFolderTransferRate', () => {
  const offers = [offer('/Photos/a.png'), offer('/Photos/b.png')]

  it('ignores rates left over from files that already completed', () => {
    const rate = getFolderTransferRate(
      offers,
      { '/Photos/a.png': state('completed', 100), '/Photos/b.png': state('downloading', 20) },
      { '/Photos/a.png': { bytesPerSecond: 900 }, '/Photos/b.png': { bytesPerSecond: 100 } }
    )
    expect(rate.bytesPerSecond).toBe(100)
    expect(rate.etaSeconds).toBe(0.8)
  })

  it('sums the rates of every file still in flight', () => {
    const rate = getFolderTransferRate(
      offers,
      { '/Photos/a.png': state('downloading', 50), '/Photos/b.png': state('downloading', 50) },
      { '/Photos/a.png': { bytesPerSecond: 40 }, '/Photos/b.png': { bytesPerSecond: 60 } }
    )
    expect(rate.bytesPerSecond).toBe(100)
    expect(rate.etaSeconds).toBe(1)
  })
})
