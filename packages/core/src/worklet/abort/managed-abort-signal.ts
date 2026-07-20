type AbortListener = () => void

export class ManagedAbortSignal {
  aborted = false
  private readonly listeners = new Set<AbortListener>()

  addEventListener(_event: 'abort', listener: AbortListener): void {
    if (this.aborted) {
      listener()
      return
    }
    this.listeners.add(listener)
  }

  removeEventListener(_event: 'abort', listener: AbortListener): void {
    this.listeners.delete(listener)
  }

  fire(): void {
    if (this.aborted) return
    this.aborted = true
    for (const listener of this.listeners) {
      try {
        listener()
      } catch (err) {
        console.warn('ManagedAbortSignal: listener threw', err)
      }
    }
    this.listeners.clear()
  }
}
