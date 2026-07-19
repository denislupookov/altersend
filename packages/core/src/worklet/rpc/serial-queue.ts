export class SerialQueue {
  private tail: Promise<unknown> = Promise.resolve(null)

  constructor(private readonly onError: (err: unknown) => void) {}

  run<T>(task: () => Promise<T>): Promise<T> {
    const result = this.tail.then(task)
    this.tail = result.catch(this.onError)
    return result
  }

  whenIdle(): Promise<unknown> {
    return this.tail
  }
}
