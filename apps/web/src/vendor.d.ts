declare module '@hyperswarm/dht-relay' {
  export default class DHT {
    constructor(stream: unknown, options?: { custodial?: boolean })
    ready(): Promise<void>
    destroy(): Promise<void>
  }
  export function relay(dht: unknown, stream: unknown): void
}

declare module '@hyperswarm/dht-relay/ws' {
  export default class Stream {
    constructor(isInitiator: boolean, socket: unknown)
  }
}

declare module 'sodium-universal' {
  const sodium: Record<string, unknown>
  export default sodium
}
