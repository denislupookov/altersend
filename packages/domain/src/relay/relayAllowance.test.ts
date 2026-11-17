import { describe, expect, it } from 'vitest'
import type { IncomingFileOffer } from '@altersend/core'
import { groupReceiveRows, type DownloadItemState } from '../receive/downloadModel'
import {
  includesLockedOffer,
  isReceiveRowLocked,
  lockedOfferKeys,
  splitRelayAllowance
} from './relayAllowance'

const MB = 1024 ** 2
const GB = 1024 ** 3

function offer(id: string, size: number, path = `${id}.bin`): IncomingFileOffer {
  return { id, transferId: 't1', name: path.split('/').pop() ?? path, path, size, kind: 'file' }
}

function names(rows: ReturnType<typeof groupReceiveRows>): string[] {
  return rows.map((row) => (row.kind === 'file' ? row.offer.id : row.name))
}

describe('splitRelayAllowance', () => {
  it('keeps files that fit in the free limit and locks the rest, in list order', () => {
    const rows = groupReceiveRows([
      offer('photo', 4 * MB),
      offer('speeches', 1.4 * GB),
      offer('contract', 2 * MB),
      offer('film', 2.1 * GB),
      offer('ceremony', 820 * MB),
      offer('music', 48 * MB)
    ])

    const split = splitRelayAllowance(rows, {}, GB)

    expect(names(split.freeRows)).toEqual(['photo', 'contract', 'ceremony', 'music'])
    expect(names(split.lockedRows)).toEqual(['speeches', 'film'])
  })

  it('locks everything when a single file is over the limit', () => {
    const split = splitRelayAllowance(groupReceiveRows([offer('film', 2 * GB)]), {}, GB)

    expect(split.freeRows).toEqual([])
    expect(names(split.lockedRows)).toEqual(['film'])
  })

  it('treats a folder as one unit', () => {
    const rows = groupReceiveRows([
      offer('a', 600 * MB, 'album/a.jpg'),
      offer('b', 600 * MB, 'album/b.jpg'),
      offer('note', 10 * MB)
    ])

    const split = splitRelayAllowance(rows, {}, GB)

    expect(names(split.freeRows)).toEqual(['note'])
    expect(names(split.lockedRows)).toEqual(['album'])
  })

  it('keeps started downloads free and counts them against the limit', () => {
    const rows = groupReceiveRows([offer('first', 300 * MB), offer('started', 900 * MB)])
    const states: Record<string, DownloadItemState> = {
      started: { status: 'downloading', bytesTransferred: 10, totalBytes: 900 * MB }
    }

    const split = splitRelayAllowance(rows, states, GB)

    expect(names(split.freeRows)).toEqual(['started'])
    expect(names(split.lockedRows)).toEqual(['first'])
  })
})

describe('includesLockedOffer', () => {
  const offers = [offer('small', 300 * MB), offer('big', 2 * GB)]

  it('allows downloading only the files that fit', () => {
    expect(includesLockedOffer(['small'], offers, {}, GB)).toBe(false)
  })

  it('refuses a request that contains a locked file', () => {
    expect(includesLockedOffer(['small', 'big'], offers, {}, GB)).toBe(true)
  })
})

describe('isReceiveRowLocked', () => {
  it('matches rows against the locked keys, folders by their files', () => {
    const rows = groupReceiveRows([offer('note', 10 * MB), offer('a', 2 * GB, 'album/a.jpg')])
    const locked = lockedOfferKeys(splitRelayAllowance(rows, {}, GB).lockedRows)

    expect(rows.map((row) => isReceiveRowLocked(row, locked))).toEqual([false, true])
  })
})
