declare module 'blake2b' {
  interface Blake2bHash {
    update(input: Uint8Array): Blake2bHash
    digest(encoding: 'hex'): string
    digest(): Uint8Array
  }
  function blake2b(outLength: number): Blake2bHash
  export = blake2b
}
