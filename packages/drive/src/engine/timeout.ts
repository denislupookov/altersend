export class Timeout {
  private readonly ms: number
  private readonly onExpire: () => void
  private timer: ReturnType<typeof setTimeout> | null = null

  constructor(ms: number, onExpire: () => void) {
    this.ms = ms
    this.onExpire = onExpire
  }

  start(): void {
    if (this.timer) return
    this.schedule()
  }

  restart(): void {
    this.stop()
    this.schedule()
  }

  stop(): void {
    if (!this.timer) return
    clearTimeout(this.timer)
    this.timer = null
  }

  private schedule(): void {
    this.timer = setTimeout(this.onExpire, this.ms)
    this.timer.unref?.()
  }
}
