import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createMainWindow, showOrCreateMainWindow } from './window.js'
import type { PearRuntimeInstance } from './runtime.js'

const mocks = vi.hoisted(() => {
  type Listener = (...args: never[]) => void

  class MockEventTarget {
    listeners = new Map<string, Set<Listener>>()

    on(event: string, listener: Listener): this {
      const listeners = this.listeners.get(event) ?? new Set<Listener>()
      listeners.add(listener)
      this.listeners.set(event, listeners)
      return this
    }

    once(event: string, listener: Listener): this {
      const wrapped = (...args: never[]) => {
        this.listeners.get(event)?.delete(wrapped)
        listener(...args)
      }
      return this.on(event, wrapped)
    }

    emit(event: string, ...args: unknown[]): void {
      for (const listener of [...(this.listeners.get(event) ?? [])]) {
        ;(listener as (...args: unknown[]) => void)(...args)
      }
    }
  }

  class MockWebContents extends MockEventTarget {
    id = 1
    session = {
      setPermissionRequestHandler: vi.fn(),
      setPermissionCheckHandler: vi.fn()
    }
    setWindowOpenHandler = vi.fn()
  }

  class MockBrowserWindow extends MockEventTarget {
    static getAllWindows(): MockBrowserWindow[] {
      return mocks.windows
    }

    destroyed = false
    visible = false
    minimized = false
    webContents = new MockWebContents()
    hide = vi.fn(() => {
      this.visible = false
    })
    show = vi.fn(() => {
      this.visible = true
    })
    restore = vi.fn(() => {
      this.minimized = false
    })
    focus = vi.fn()
    loadFile = vi.fn(async (_path: string) => {})
    loadURL = vi.fn(async (_url: string) => {})

    constructor(_options: unknown) {
      super()
      mocks.windows.push(this)
    }

    isDestroyed(): boolean {
      return this.destroyed
    }

    isVisible(): boolean {
      return this.visible
    }

    isMinimized(): boolean {
      return this.minimized
    }
  }

  return {
    MockBrowserWindow,
    windows: [] as MockBrowserWindow[]
  }
})

vi.mock('electron', () => ({
  app: { isPackaged: true },
  BrowserWindow: mocks.MockBrowserWindow,
  screen: {
    getPrimaryDisplay: () => ({ workAreaSize: { width: 1280, height: 900 } })
  },
  shell: { openExternal: vi.fn() }
}))

vi.mock('which-runtime', () => ({ isLinux: false }))
vi.mock('./pathAccess.js', () => ({ forgetPickedPaths: vi.fn() }))
vi.mock('./theme.js', () => ({
  applyThemeSource: vi.fn(),
  loadThemeSource: vi.fn(async () => 'system'),
  windowBackgroundColor: vi.fn(() => 'background')
}))

function createPear(): PearRuntimeInstance {
  return {
    updater: {
      on: vi.fn(),
      removeListener: vi.fn()
    }
  } as unknown as PearRuntimeInstance
}

async function createWindow(shouldHideOnClose: () => boolean = () => true) {
  await createMainWindow(createPear(), shouldHideOnClose)
  return mocks.windows[0]
}

beforeEach(() => {
  mocks.windows.length = 0
  vi.useFakeTimers()
})

afterEach(() => {
  vi.useRealTimers()
})

describe('main window tray close policy', () => {
  it('prevents close and hides the same window when enabled', async () => {
    const win = await createWindow()
    const event = { preventDefault: vi.fn() }

    win.emit('close', event)

    expect(event.preventDefault).toHaveBeenCalledOnce()
    expect(win.hide).toHaveBeenCalledOnce()
    expect(win.isVisible()).toBe(false)
    expect(mocks.MockBrowserWindow.getAllWindows()).toEqual([win])
  })

  it('does not auto-show an intentionally hidden window', async () => {
    const win = await createWindow()
    win.emit('close', { preventDefault: vi.fn() })
    win.show.mockClear()

    win.emit('ready-to-show')
    win.webContents.emit('did-finish-load')
    await vi.advanceTimersByTimeAsync(4000)

    expect(win.show).not.toHaveBeenCalled()
    expect(win.isVisible()).toBe(false)
  })

  it('restores, reveals and focuses the hidden window without creating a duplicate', async () => {
    const win = await createWindow()
    win.emit('close', { preventDefault: vi.fn() })
    win.minimized = true
    win.show.mockClear()

    await showOrCreateMainWindow(createPear())

    expect(mocks.windows).toHaveLength(1)
    expect(win.restore).toHaveBeenCalledOnce()
    expect(win.show).toHaveBeenCalledOnce()
    expect(win.focus).toHaveBeenCalledOnce()
    expect(win.isVisible()).toBe(true)
    expect(win.isMinimized()).toBe(false)
  })

  it('leaves close untouched when the policy is disabled', async () => {
    const win = await createWindow(() => false)
    const event = { preventDefault: vi.fn() }
    win.hide.mockClear()

    win.emit('close', event)

    expect(event.preventDefault).not.toHaveBeenCalled()
    expect(win.hide).not.toHaveBeenCalled()
  })

  it('bypasses tray hiding during query-session-end', async () => {
    const win = await createWindow()
    const event = { preventDefault: vi.fn() }
    win.hide.mockClear()

    win.emit('query-session-end')
    win.emit('close', event)

    expect(event.preventDefault).not.toHaveBeenCalled()
    expect(win.hide).not.toHaveBeenCalled()
  })

  it('rechecks the policy so quitting an already hidden window is not blocked', async () => {
    let hide = true
    const win = await createWindow(() => hide)
    win.emit('close', { preventDefault: vi.fn() })
    hide = false
    const event = { preventDefault: vi.fn() }
    win.emit('close', event)
    expect(event.preventDefault).not.toHaveBeenCalled()
  })

  it('passes the close policy to a newly recreated window', async () => {
    await showOrCreateMainWindow(createPear(), () => true)
    const event = { preventDefault: vi.fn() }
    mocks.windows[0].emit('close', event)
    expect(event.preventDefault).toHaveBeenCalledOnce()
  })

  it('does not create duplicate windows for concurrent Open requests', async () => {
    await Promise.all([
      showOrCreateMainWindow(createPear(), () => true),
      showOrCreateMainWindow(createPear(), () => true)
    ])
    expect(mocks.windows).toHaveLength(1)
  })

  it('keeps the default normal close behavior', async () => {
    await createMainWindow(createPear())
    const event = { preventDefault: vi.fn() }
    mocks.windows[0].emit('close', event)
    expect(event.preventDefault).not.toHaveBeenCalled()
  })
})
