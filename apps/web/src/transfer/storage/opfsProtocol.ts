export interface OpenMsg {
  type: 'open'
  id: number
  name: string
  size: number
}

export interface WriteMsg {
  type: 'write'
  id: number
  name: string
  offset: number
  buffer: ArrayBuffer
}

export interface CloseMsg {
  type: 'finalize' | 'abort' | 'discard'
  id: number
  name: string
}

interface ProbeMsg {
  type: 'probe'
  id: number
}

interface SweepMsg {
  type: 'sweep'
  id: number
}

export type OpfsMsg = OpenMsg | WriteMsg | CloseMsg | ProbeMsg | SweepMsg

export const DL_PREFIX = 'dl-'

export interface OpfsReply {
  id: number
  ok: boolean
  error?: string
  supported?: boolean
}
