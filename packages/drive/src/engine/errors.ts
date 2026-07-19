export class IntegrityError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'IntegrityError'
  }
}

export const PEER_SILENCE_TIMEOUT_MS = 60_000
