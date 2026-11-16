export class PeerLostError extends Error {
  constructor(message = 'Lost the connection to the sender') {
    super(message)
    this.name = 'PeerLostError'
  }
}
