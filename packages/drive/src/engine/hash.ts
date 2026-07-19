import blake2bJs from 'blake2b'
import blake2bWasm from 'blake2b-wasm'

const DIGEST_BYTES = 32

let create = blake2bJs

export function ready(): Promise<boolean> {
  return new Promise((resolve) => {
    blake2bWasm.ready((err) => {
      if (!err) create = blake2bWasm
      resolve(!err)
    })
  })
}

export function hashChunk(data: Uint8Array): string {
  return create(DIGEST_BYTES).update(data).digest('hex')
}

export interface StreamingHasher {
  update(data: Uint8Array): void
  digest(): string
}

export function createHasher(): StreamingHasher {
  const h = create(DIGEST_BYTES)
  return {
    update(data) {
      h.update(data)
    },
    digest() {
      return h.digest('hex')
    }
  }
}

function hexToBytes(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2)
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16)
  }
  return bytes
}

export interface FileHasher {
  add(chunkHash: string): void
  digest(): string
}

export function createFileHasher(): FileHasher {
  const h = createHasher()
  return {
    add(chunkHash) {
      h.update(hexToBytes(chunkHash))
    },
    digest() {
      return h.digest()
    }
  }
}
