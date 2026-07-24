declare module '@hyperswarm/secret-stream' {
  export default class SecretStream {
    constructor(isInitiator: boolean, rawStream?: unknown)
  }
}

declare module 'streamx' {
  export class Duplex {
    constructor(opts?: { write?(data: Uint8Array, cb: (err?: Error) => void): void })
    push(data: Uint8Array): boolean
  }
}
