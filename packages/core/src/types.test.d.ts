declare module '@hyperswarm/secret-stream' {
  export default class SecretStream {
    constructor(
      isInitiator: boolean,
      rawStream?: unknown,
      opts?: { keyPair?: { publicKey: Uint8Array; secretKey: Uint8Array } }
    )
    opened: Promise<boolean>
    remotePublicKey: Uint8Array
    handshakeHash: Uint8Array
    on(event: 'close', listener: () => void): this
  }
}

declare module 'streamx' {
  export class Duplex {
    constructor(opts?: { write?(data: Uint8Array, cb: (err?: Error) => void): void })
    push(data: Uint8Array): boolean
  }
}
