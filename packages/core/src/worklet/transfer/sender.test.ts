import { describe, it, expect, vi } from 'vitest'
import { mkdtemp, writeFile, stat, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import type Hyperdrive from 'hyperdrive'
import type Localdrive from 'localdrive'
import { LegacyPeerStaging } from './legacy/staging'
import { TransferSender, type ScannedFile } from './sender'

function untouchableDrive(): Hyperdrive {
  const key = new Uint8Array(32).fill(7)
  return new Proxy(
    { key },
    {
      get(target, prop) {
        if (prop === 'key') return target.key
        throw new Error(`Hyperdrive.${String(prop)} was used, so the file got copied`)
      }
    }
  ) as unknown as Hyperdrive
}

function scanned(name: string, size: number): ScannedFile {
  return {
    fileName: name,
    inputPath: `/src/${name}`,
    sourcePath: `/${name}`,
    sourceDrive: {} as Localdrive,
    size
  }
}

describe('TransferSender.buildOffers', () => {
  it('describes files without copying them into the Hyperdrive', () => {
    const sender = new TransferSender(untouchableDrive())

    const offers = sender.buildOffers([scanned('a.bin', 10), scanned('b.bin', 20)], 't1')

    expect(offers.map((offer) => offer.name)).toEqual(['a.bin', 'b.bin'])
    expect(offers.map((offer) => offer.size)).toEqual([10, 20])
    expect(offers.every((offer) => offer.transferId === 't1')).toBe(true)
    expect(offers.every((offer) => offer.driveKey === '07'.repeat(32))).toBe(true)
  })

  it('maps each offer back to the file on disk so drive can read it', () => {
    const sender = new TransferSender(untouchableDrive())

    const [offer] = sender.buildOffers([scanned('a.bin', 10)], 't1')

    expect(sender.localPath(offer.id)).toBe('/src/a.bin')
    expect(sender.localPath('unknown')).toBeNull()
  })

  it('gives every offer a distinct id', () => {
    const sender = new TransferSender(untouchableDrive())

    const offers = sender.buildOffers([scanned('a.bin', 1), scanned('a.bin', 1)], 't1')

    expect(offers[0].id).not.toBe(offers[1].id)
  })
})

describe('TransferSender.reset', () => {
  it('deletes temporary files even when a drive peer meant nothing was staged', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'sender-temp-'))
    const picked = join(dir, 'pic.jpg')
    await writeFile(picked, 'x')

    const sender = new TransferSender(untouchableDrive())
    sender.buildOffers([{ ...scanned('pic.jpg', 1), inputPath: picked, isTemporary: true }], 't1')

    await sender.reset()

    await expect(stat(picked)).rejects.toThrow()
    await rm(dir, { recursive: true, force: true })
  })
})

describe('TransferSender.stageForLegacyPeers', () => {
  it('runs again for a later peer after a run was aborted', async () => {
    const sender = new TransferSender(untouchableDrive())
    sender.buildOffers([{ ...scanned('a.bin', 1), alreadyStaged: true }], 't1')

    const cancelled = new AbortController()
    cancelled.abort()
    await expect(sender.stageForLegacyPeers(() => {}, cancelled.signal)).rejects.toThrow()

    const onStaging = vi.fn()
    await sender.stageForLegacyPeers(onStaging, new AbortController().signal)
    expect(onStaging).toHaveBeenCalledTimes(1)
  })

  it('reports every file, including ones already in the drive', async () => {
    const sender = new TransferSender(untouchableDrive())
    sender.buildOffers(
      [
        { ...scanned('a.bin', 1), alreadyStaged: true },
        { ...scanned('b.bin', 2), alreadyStaged: true }
      ],
      't1'
    )

    const onStaging = vi.fn()
    await sender.stageForLegacyPeers(onStaging, new AbortController().signal)

    expect(onStaging.mock.calls.map(([file]) => file.fileName)).toEqual(['a.bin', 'b.bin'])
  })
})

describe('TransferSender staging races', () => {
  it('leaves a newer share alone when an older run finishes importing', async () => {
    let letImportFinish!: () => void
    const stuck = new Promise<void>((resolve) => {
      letImportFinish = resolve
    })
    const importing = vi
      .spyOn(
        LegacyPeerStaging.prototype as unknown as { importToDrive: () => Promise<void> },
        'importToDrive'
      )
      .mockImplementation(() => stuck)

    try {
      const sender = new TransferSender(untouchableDrive())
      sender.buildOffers([scanned('old.bin', 1)], 'old')
      const old = sender.stageForLegacyPeers(() => {}, new AbortController().signal)

      await sender.reset()
      sender.buildOffers([scanned('new.bin', 1)], 'new')

      letImportFinish()
      await old

      const seen = vi.fn()
      await sender.stageForLegacyPeers(seen, new AbortController().signal)
      expect(seen.mock.calls.map(([file]) => file.fileName)).toEqual(['new.bin'])
    } finally {
      importing.mockRestore()
    }
  })
})
