import c, { type Encoding } from 'compact-encoding'
import type { ChunkHeader } from './engine/types'

export const DRIVE_PROTOCOL = 'altersend/drive'

export interface ChunkFrame extends ChunkHeader {
  data: Uint8Array
}

export const chunkEncoding: Encoding<ChunkFrame> = {
  preencode(state, frame) {
    c.string.preencode(state, frame.transferId)
    c.uint.preencode(state, frame.index)
    c.raw.preencode(state, frame.data)
  },
  encode(state, frame) {
    c.string.encode(state, frame.transferId)
    c.uint.encode(state, frame.index)
    c.raw.encode(state, frame.data)
  },
  decode(state) {
    return {
      transferId: c.string.decode(state),
      index: c.uint.decode(state),
      data: c.raw.decode(state)
    }
  }
}
