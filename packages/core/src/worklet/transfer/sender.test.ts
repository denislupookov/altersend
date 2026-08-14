import { describe, it, expect } from 'vitest'
import { mkdtemp, writeFile, stat, rm, mkdir } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { TransferSender, type ScannedFile } from './sender'

function scanned(name: string, size: number): ScannedFile {
  return {
    fileName: name,
    displayName: name,
    inputPath: `/src/${name}`,
    sourcePath: `/${name}`,
    size
  }
}

describe('TransferSender.buildOffers', () => {
  it('describes files without copying them anywhere', () => {
    const sender = new TransferSender()

    const offers = sender.buildOffers([scanned('a.bin', 10), scanned('b.bin', 20)], 't1')

    expect(offers.map((offer) => offer.name)).toEqual(['a.bin', 'b.bin'])
    expect(offers.map((offer) => offer.size)).toEqual([10, 20])
    expect(offers.every((offer) => offer.transferId === 't1')).toBe(true)
  })

  it('maps each offer back to the file on disk so drive can read it', () => {
    const sender = new TransferSender()

    const [offer] = sender.buildOffers([scanned('a.bin', 10)], 't1')

    expect(sender.localPath(offer.id)).toBe('/src/a.bin')
    expect(sender.localPath('unknown')).toBeNull()
  })

  it('gives every offer a distinct id', () => {
    const sender = new TransferSender()

    const offers = sender.buildOffers([scanned('a.bin', 1), scanned('a.bin', 1)], 't1')

    expect(offers[0].id).not.toBe(offers[1].id)
  })

  it('sends the picker display name on the wire, not the on-disk cache file name', () => {
    const sender = new TransferSender()

    const [offer] = sender.buildOffers(
      [
        { ...scanned('a1b2c3d4-e5f6-47a8-9b0c-1d2e3f4a5b6c.flac', 10), displayName: 'My Song.flac' }
      ],
      't1'
    )

    expect(offer.name).toBe('My Song.flac')
  })
})

describe('TransferSender.scanFiles', () => {
  it('measures files on disk and keeps the folder structure in the offer path', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'sender-scan-'))
    await mkdir(join(dir, 'photos'))
    const picked = join(dir, 'photos', 'pic.jpg')
    await writeFile(picked, 'hello')

    const sender = new TransferSender()
    const result = await sender.scanFiles([{ path: picked, relativePath: 'photos/pic.jpg' }])

    expect(result.errors).toEqual([])
    expect(result.totalBytes).toBe(5)
    expect(result.files[0].sourcePath).toBe('/photos/pic.jpg')
    expect(result.files[0].size).toBe(5)

    await rm(dir, { recursive: true, force: true })
  })

  it('reports files it cannot read instead of offering them', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'sender-missing-'))

    const sender = new TransferSender()
    const result = await sender.scanFiles([{ path: join(dir, 'gone.bin') }, { path: dir }])

    expect(result.files).toEqual([])
    expect(result.errors).toHaveLength(2)

    await rm(dir, { recursive: true, force: true })
  })
})

describe('TransferSender.reset', () => {
  it('deletes temporary files', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'sender-temp-'))
    const picked = join(dir, 'pic.jpg')
    await writeFile(picked, 'x')

    const sender = new TransferSender()
    sender.buildOffers([{ ...scanned('pic.jpg', 1), inputPath: picked, isTemporary: true }], 't1')

    await sender.reset()

    await expect(stat(picked)).rejects.toThrow()
    await rm(dir, { recursive: true, force: true })
  })
})
