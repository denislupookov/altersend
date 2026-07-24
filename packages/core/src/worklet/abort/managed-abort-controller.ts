import { ManagedAbortSignal } from './managed-abort-signal'

export class ManagedAbortController {
  readonly signal: ManagedAbortSignal = new ManagedAbortSignal()

  abort(): void {
    this.signal.fire()
  }
}
