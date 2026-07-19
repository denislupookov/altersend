declare module 'blake2b-wasm' {
  interface Blake2bHash {
    update(input: Uint8Array): Blake2bHash
    digest(encoding: 'hex'): string
    digest(): Uint8Array
  }
  function blake2b(outLength: number): Blake2bHash
  namespace blake2b {
    function ready(cb: (err: Error | null) => void): void
  }
  export = blake2b
}
