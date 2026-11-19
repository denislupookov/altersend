import { beforeEach, describe, expect, it, vi } from 'vitest'
import { SystemTrayController } from './systemTray.js'

const mocks = vi.hoisted(() => {
  class MockTray {
    destroyed = false
    listeners = new Map<string, () => void>()
    setToolTip = vi.fn((_tooltip: string) => {})
    setContextMenu = vi.fn((_menu: unknown) => {})
    destroy = vi.fn(() => {
      this.destroyed = true
    })

    constructor(_image: unknown) {
      mocks.trays.push(this)
    }

    on(event: string, listener: () => void): this {
      this.listeners.set(event, listener)
      return this
    }

    isDestroyed(): boolean {
      return this.destroyed
    }

    click(): void {
      this.listeners.get('click')?.()
    }
  }

  return {
    MockTray,
    trays: [] as MockTray[],
    emptyIcon: false,
    buildFromTemplate: vi.fn((template: Array<{ label: string; click: () => void }>) => ({
      template
    }))
  }
})

vi.mock('electron', () => ({
  Tray: mocks.MockTray,
  Menu: { buildFromTemplate: mocks.buildFromTemplate },
  nativeImage: {
    createFromPath: vi.fn(() => ({
      isEmpty: () => mocks.emptyIcon,
      resize: vi.fn(() => ({}))
    }))
  }
}))

vi.mock('./store/index.js', () => ({
  createJsonStore: vi.fn(() => ({
    read: vi.fn(async () => ({ enabled: false })),
    write: vi.fn(async () => {})
  }))
}))

function createStore(enabled = false) {
  return {
    read: vi.fn(async () => ({ enabled })),
    write: vi.fn(async (_value: { enabled: boolean }) => {})
  }
}

function createController(enabled = false) {
  const open = vi.fn()
  const quit = vi.fn()
  const store = createStore(enabled)
  const controller = new SystemTrayController({ open, quit }, store)
  controller.setLabels({ open: 'Open', quit: 'Quit', tooltip: 'AlterSend' })
  return { controller, open, quit, store }
}

beforeEach(() => {
  mocks.trays.length = 0
  mocks.emptyIcon = false
  mocks.buildFromTemplate.mockClear()
})

describe('SystemTrayController', () => {
  it('stays disabled by default', async () => {
    const { controller } = createController()

    await controller.initialize()

    expect(mocks.trays).toHaveLength(0)
    expect(controller.isActive()).toBe(false)
    expect(controller.shouldHideOnClose()).toBe(false)
  })

  it('restores the enabled setting and creates a localized menu', async () => {
    const { controller } = createController(true)

    await controller.initialize()

    expect(mocks.trays).toHaveLength(1)
    expect(controller.isActive()).toBe(true)
    expect(mocks.trays[0].setToolTip).toHaveBeenCalledWith('AlterSend')
    expect(mocks.buildFromTemplate).toHaveBeenCalledWith([
      { label: 'Open', click: expect.any(Function) },
      { label: 'Quit', click: expect.any(Function) }
    ])
  })

  it('restores the enabled tray when renderer labels become available', async () => {
    const open = vi.fn()
    const quit = vi.fn()
    const controller = new SystemTrayController({ open, quit }, createStore(true))

    await controller.initialize()
    expect(mocks.trays).toHaveLength(0)
    expect(controller.isEnabled()).toBe(true)

    controller.setLabels({ open: 'Open', quit: 'Quit', tooltip: 'AlterSend' })
    expect(mocks.trays).toHaveLength(1)
    expect(controller.shouldHideOnClose()).toBe(true)
  })

  it('does not enable the tray for invalid persisted values', async () => {
    const { controller, store } = createController()
    store.read.mockResolvedValue({ enabled: 'yes' } as unknown as { enabled: boolean })

    await controller.initialize()

    expect(controller.isActive()).toBe(false)
  })

  it('hides on close only while the tray is active and the app is not quitting', async () => {
    const { controller } = createController(true)
    await controller.initialize()

    expect(controller.shouldHideOnClose()).toBe(true)
    controller.beginQuit()
    expect(controller.shouldHideOnClose()).toBe(false)
  })

  it('opens the window from the icon and quits from the menu', async () => {
    const { controller, open, quit } = createController(true)
    await controller.initialize()

    mocks.trays[0].click()
    const menu = mocks.buildFromTemplate.mock.results[0].value as {
      template: Array<{ click: () => void }>
    }
    menu.template[1].click()

    expect(open).toHaveBeenCalledOnce()
    expect(quit).toHaveBeenCalledOnce()
  })

  it('destroys the tray and reveals the window when disabled', async () => {
    const { controller, open, store } = createController(true)
    await controller.initialize()

    await expect(controller.setEnabled(false)).resolves.toBe(false)

    expect(mocks.trays[0].destroy).toHaveBeenCalledOnce()
    expect(open).toHaveBeenCalledOnce()
    expect(store.write).toHaveBeenCalledWith({ enabled: false })
    expect(controller.shouldHideOnClose()).toBe(false)
  })

  it('does not leak tray instances when re-enabled', async () => {
    const { controller } = createController()

    await expect(controller.setEnabled(true)).resolves.toBe(true)
    await expect(controller.setEnabled(true)).resolves.toBe(true)
    await controller.setEnabled(false)
    await controller.setEnabled(true)

    expect(mocks.trays).toHaveLength(2)
    expect(mocks.trays[0].destroy).toHaveBeenCalledOnce()
    expect(controller.isActive()).toBe(true)
  })

  it('keeps normal close behavior if the tray icon cannot be created', async () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => {})
    mocks.emptyIcon = true
    const { controller } = createController(true)

    await controller.initialize()

    expect(controller.isActive()).toBe(false)
    expect(controller.shouldHideOnClose()).toBe(false)
    error.mockRestore()
  })

  it('rebuilds the native menu when localized labels change', async () => {
    const { controller } = createController(true)
    await controller.initialize()
    mocks.buildFromTemplate.mockClear()

    controller.setLabels({ open: 'Öffnen', quit: 'Beenden', tooltip: 'AlterSend' })

    expect(mocks.buildFromTemplate).toHaveBeenCalledWith([
      { label: 'Öffnen', click: expect.any(Function) },
      { label: 'Beenden', click: expect.any(Function) }
    ])
    expect(mocks.trays[0].setContextMenu).toHaveBeenCalledTimes(2)
  })

  it('updates the tooltip when labels change', async () => {
    const { controller } = createController(true)
    await controller.initialize()
    controller.setLabels({ open: 'Open', quit: 'Quit', tooltip: 'Localized name' })
    expect(mocks.trays[0].setToolTip).toHaveBeenLastCalledWith('Localized name')
  })

  it.each(['', '   ', 'Open\n', 'Open\u0000', 'a'.repeat(257)])(
    'rejects invalid menu labels (%j)',
    (open) => {
      const { controller } = createController()
      expect(() => controller.setLabels({ open, quit: 'Quit', tooltip: 'AlterSend' })).toThrow(
        'Invalid system tray labels'
      )
    }
  )

  it('rolls back activation when persistence fails and permits retry', async () => {
    const { controller, store, open } = createController()
    store.write.mockRejectedValueOnce(new Error('disk full'))
    await expect(controller.setEnabled(true)).rejects.toThrow('Could not save')
    expect(controller.isActive()).toBe(false)
    expect(controller.isEnabled()).toBe(false)
    expect(open).toHaveBeenCalledOnce()
    await expect(controller.setEnabled(true)).resolves.toBe(true)
  })

  it('keeps an active tray when disabling cannot be persisted', async () => {
    const { controller, store, open } = createController(true)
    await controller.initialize()
    store.write.mockRejectedValueOnce(new Error('disk full'))
    await expect(controller.setEnabled(false)).rejects.toThrow('Could not save')
    expect(controller.isActive()).toBe(true)
    expect(controller.isEnabled()).toBe(true)
    expect(open).not.toHaveBeenCalled()
  })

  it('serializes overlapping changes in request order', async () => {
    const { controller, store } = createController()
    let release!: () => void
    store.write.mockImplementationOnce(() => new Promise<void>((resolve) => (release = resolve)))
    const enable = controller.setEnabled(true)
    const disable = controller.setEnabled(false)
    await Promise.resolve()
    expect(store.write).toHaveBeenCalledTimes(1)
    release()
    await expect(enable).resolves.toBe(true)
    await expect(disable).resolves.toBe(false)
    expect(store.write.mock.calls).toEqual([[{ enabled: true }], [{ enabled: false }]])
    expect(controller.isActive()).toBe(false)
  })

  it('rejects enabling before labels are ready without persisting false', async () => {
    const store = createStore()
    const controller = new SystemTrayController({ open: vi.fn(), quit: vi.fn() }, store)
    await expect(controller.setEnabled(true)).rejects.toThrow('unavailable')
    expect(store.write).not.toHaveBeenCalled()
  })

  it('does not reactivate after quit has started', async () => {
    const { controller, store } = createController()
    controller.beginQuit()
    await expect(controller.setEnabled(true)).rejects.toThrow('quitting')
    expect(store.write).not.toHaveBeenCalled()
    expect(controller.isActive()).toBe(false)
  })

  it('waits for initialization before applying an early preference change', async () => {
    const { controller, store } = createController()
    let release!: (value: { enabled: boolean }) => void
    store.read.mockImplementationOnce(
      () => new Promise<{ enabled: boolean }>((resolve) => (release = resolve))
    )
    const initialize = controller.initialize()
    const disable = controller.setEnabled(false)
    await Promise.resolve()
    expect(store.write).not.toHaveBeenCalled()
    release({ enabled: true })
    await initialize
    await expect(disable).resolves.toBe(false)
    expect(controller.isEnabled()).toBe(false)
    expect(controller.isActive()).toBe(false)
  })

  it('reads the settled state for a remounted settings view while a disable is pending', async () => {
    const { controller, store } = createController(true)
    await controller.initialize()
    let release!: () => void
    store.write.mockImplementationOnce(() => new Promise<void>((resolve) => (release = resolve)))
    const disable = controller.setEnabled(false)
    await Promise.resolve()
    expect(controller.isEnabled()).toBe(true)
    const read = controller.getEnabled()
    release()
    await expect(read).resolves.toBe(false)
    await expect(disable).resolves.toBe(false)
    expect(controller.isEnabled()).toBe(false)
  })

  it('does not reopen the window when a pending disable finishes during quit', async () => {
    const { controller, store, open } = createController(true)
    await controller.initialize()
    let release!: () => void
    store.write.mockImplementationOnce(() => new Promise<void>((resolve) => (release = resolve)))
    const disable = controller.setEnabled(false)
    await Promise.resolve()
    controller.beginQuit()
    release()
    await disable
    expect(open).not.toHaveBeenCalled()
    expect(controller.shouldHideOnClose()).toBe(false)
  })
})
