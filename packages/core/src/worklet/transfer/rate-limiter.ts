export class RateLimiter {
  private nextSlotAt = 0

  constructor(
    private readonly bytesPerSecond: number,
    private readonly now: () => number = Date.now
  ) {}

  take(bytes: number): Promise<void> {
    const now = this.now()
    const start = Math.max(now, this.nextSlotAt)
    this.nextSlotAt = start + (bytes / this.bytesPerSecond) * 1000
    const wait = start - now
    if (wait <= 0) return Promise.resolve()
    return new Promise((resolve) => setTimeout(resolve, wait))
  }
}
