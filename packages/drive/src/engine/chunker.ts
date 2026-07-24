interface Tier {
  maxFileSize: number
  chunkSize: number
}

const KB = 1024
const MB = 1024 * KB
const GB = 1024 * MB

const TIERS: readonly Tier[] = [
  { maxFileSize: 1 * MB, chunkSize: 64 * KB },
  { maxFileSize: 100 * MB, chunkSize: 256 * KB },
  { maxFileSize: 10 * GB, chunkSize: 1 * MB }
]

const LARGE_CHUNK_SIZE = 4 * MB

export function selectChunkSize(size: number): number {
  for (const tier of TIERS) {
    if (size < tier.maxFileSize) return tier.chunkSize
  }
  return LARGE_CHUNK_SIZE
}

export function chunkCount(size: number, chunkSize: number): number {
  if (size <= 0) return 0
  return Math.ceil(size / chunkSize)
}

export interface ChunkRange {
  offset: number
  length: number
}

export function chunkRange(index: number, size: number, chunkSize: number): ChunkRange {
  const offset = index * chunkSize
  if (offset >= size) return { offset: size, length: 0 }
  return { offset, length: Math.min(chunkSize, size - offset) }
}
