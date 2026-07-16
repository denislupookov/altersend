import type { FileHandle } from 'node:fs/promises'

export async function readRange(
  handle: FileHandle,
  offset: number,
  length: number
): Promise<Uint8Array> {
  const buffer = new Uint8Array(length)
  const { bytesRead } = await handle.read(buffer, 0, length, offset)
  return bytesRead === length ? buffer : buffer.subarray(0, bytesRead)
}
