declare module 'compact-encoding' {
  export interface EncodingState {
    start: number
    end: number
    buffer: Uint8Array | null
  }
  export interface Encoding<T> {
    preencode(state: EncodingState, value: T): void
    encode(state: EncodingState, value: T): void
    decode(state: EncodingState): T
  }
  export const json: unknown
  export const string: Encoding<string>
  export const uint: Encoding<number>
  export const raw: Encoding<Uint8Array>
  const _default: {
    json: typeof json
    string: typeof string
    uint: typeof uint
    raw: typeof raw
  }
  export default _default
}
