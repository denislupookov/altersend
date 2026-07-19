import { describe, it, expect } from 'vitest'
import { hashChunk, createHasher, createFileHasher, ready } from './hash'

function bytes(n: number): Uint8Array {
  const out = new Uint8Array(n)
  for (let i = 0; i < n; i++) out[i] = (i * 31 + 7) & 0xff
  return out
}

const VECTORS: [number, string][] = [
  [0, '0e5751c026e543b2e8ab2eb06099daa1d1e5df47778f7787faab45cdf12fe3a8'],
  [1, '873e4fe9e41e924911bba3ec53ff4782efc8c0f244fb75c879f8a4328d0142ca'],
  [63, '0745452c1dfca7e1ea6051fc7112a622b0131377e4ab08825d5b8223b37e0a8a'],
  [64, '7f6ac9517a5a27b6a059aca25d95f3a144115a759b71ee3990df65191573c5e2'],
  [65, 'cbcc0b56230a8c21aaa9ce88b5631ebd9dbd1aebd009a765f77f0ce0b9793023'],
  [1024, 'acb61fad7b8eb85172fe559f00c492e1398fc34ab8d0109ac52b150bf3e514be'],
  [200 * 1024, '5154304015b8b37f4abdedff1fbd6e65f4fa0706e0bccd8c33683f1f7bee2a97']
]

describe('chunk hashing', () => {
  it('matches known BLAKE2b-256 digests', async () => {
    await ready()
    for (const [n, expected] of VECTORS) {
      expect(hashChunk(bytes(n))).toBe(expected)
    }
  })

  it('streams in pieces to the same digest as one shot', async () => {
    await ready()
    const data = bytes(5000)
    const streaming = createHasher()
    streaming.update(data.subarray(0, 1000))
    streaming.update(data.subarray(1000))
    expect(streaming.digest()).toBe(hashChunk(data))
  })

  it('folds chunk hashes into a stable file root', async () => {
    await ready()
    const root = createFileHasher()
    root.add(hashChunk(bytes(64)))
    root.add(hashChunk(bytes(65)))

    const again = createFileHasher()
    again.add(VECTORS[3][1])
    again.add(VECTORS[4][1])

    expect(root.digest()).toBe(again.digest())
  })
})

describe('js fallback', () => {
  it('produces the same digests as wasm', async () => {
    const js = (await import('blake2b')).default
    for (const [n, expected] of VECTORS) {
      expect(js(32).update(bytes(n)).digest('hex')).toBe(expected)
    }
  })

  it('hashes before ready() has been awaited', () => {
    expect(hashChunk(bytes(64))).toBe(VECTORS[3][1])
  })
})
