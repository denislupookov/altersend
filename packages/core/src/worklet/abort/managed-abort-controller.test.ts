import { describe, it, expect } from 'vitest'
import { ManagedAbortController } from './managed-abort-controller'

describe('ManagedAbortController', () => {
  it('notifies listeners when aborted', () => {
    const controller = new ManagedAbortController()
    let notified = false
    controller.signal.addEventListener('abort', () => {
      notified = true
    })
    controller.abort()
    expect(notified).toBe(true)
    expect(controller.signal.aborted).toBe(true)
  })

  it('runs a listener added after the abort', () => {
    const controller = new ManagedAbortController()
    controller.abort()
    let notified = false
    controller.signal.addEventListener('abort', () => {
      notified = true
    })
    expect(notified).toBe(true)
  })

  it('only fires once', () => {
    const controller = new ManagedAbortController()
    let count = 0
    controller.signal.addEventListener('abort', () => count++)
    controller.abort()
    controller.abort()
    expect(count).toBe(1)
  })

  it('does not let one throwing listener stop the others', () => {
    const controller = new ManagedAbortController()
    let reached = false
    controller.signal.addEventListener('abort', () => {
      throw new Error('boom')
    })
    controller.signal.addEventListener('abort', () => {
      reached = true
    })
    controller.abort()
    expect(reached).toBe(true)
  })
})
