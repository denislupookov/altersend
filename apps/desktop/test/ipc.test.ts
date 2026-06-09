import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { DesktopRuntime } from '../src/electron/runtime'

const electronMock = vi.hoisted(() => ({
  handlers: new Map<string, (...args: unknown[]) => unknown>(),
  showOpenDialog: vi.fn(),
  showSaveDialog: vi.fn(),
  reset() {
    this.handlers.clear()
    this.showOpenDialog.mockReset()
    this.showSaveDialog.mockReset()
  }
}))

vi.mock('electron', () => ({
  BrowserWindow: { fromWebContents: () => undefined },
  dialog: {
    showOpenDialog: electronMock.showOpenDialog,
    showSaveDialog: electronMock.showSaveDialog
  },
  ipcMain: {
    on: vi.fn(),
    handle: vi.fn((channel: string, handler: (...args: unknown[]) => unknown) => {
      electronMock.handlers.set(channel, handler)
    })
  },
  shell: {
    showItemInFolder: vi.fn(),
    openPath: vi.fn(),
    openExternal: vi.fn()
  },
  systemPreferences: {
    getMediaAccessStatus: vi.fn(),
    askForMediaAccess: vi.fn()
  }
}))

vi.mock('fs/promises', () => ({
  stat: vi.fn(async () => ({ size: 5 }))
}))

vi.mock('which-runtime', () => ({ isMac: false }))
vi.mock('../src/electron/sentry.js', () => ({ setReportingEnabled: vi.fn() }))

const { registerIpcHandlers } = await import('../src/electron/ipc')

function createRuntime(): DesktopRuntime {
  return {
    metadata: {
      pkg: {},
      productName: 'AlterSend',
      protocol: 'altersend',
      version: '1.1.0',
      upgrade: ''
    },
    allowMultipleInstances: false,
    getPear: vi.fn(),
    startWorker: vi.fn(),
    invokeWorker: vi.fn(async () => ({ ok: true })),
    disconnectWorker: vi.fn(),
    restartApp: vi.fn(),
    forwardDeepLink: vi.fn()
  }
}

function event(senderId: number) {
  return { sender: { id: senderId } }
}

describe('registerIpcHandlers transfer path authorization', () => {
  beforeEach(() => {
    electronMock.reset()
  })

  it('rejects unpicked share paths before invoking the worker', async () => {
    const runtime = createRuntime()
    registerIpcHandlers(runtime)
    const invoke = electronMock.handlers.get('pear:worker:invoke')
    if (!invoke) throw new Error('pear:worker:invoke handler was not registered')

    await expect(
      invoke(event(1), 'workers/main.js', 'shareFiles', ['C:\\Users\\alice\\Secrets\\token.txt'])
    ).rejects.toThrow('Refused: shareFiles path not from a user-approved dialog')
    expect(runtime.invokeWorker).not.toHaveBeenCalled()
  })

  it('allows picked share paths through the worker IPC boundary', async () => {
    const runtime = createRuntime()
    electronMock.showOpenDialog.mockResolvedValue({
      canceled: false,
      filePaths: ['C:\\Users\\alice\\Desktop\\photo.jpg']
    })
    registerIpcHandlers(runtime)
    const pickFiles = electronMock.handlers.get('app:pickFiles')
    const invoke = electronMock.handlers.get('pear:worker:invoke')
    if (!pickFiles || !invoke) throw new Error('expected IPC handlers were not registered')

    await pickFiles(event(1))
    await expect(
      invoke(event(1), 'workers/main.js', 'shareFiles', [
        'C:\\Users\\alice\\Desktop\\photo.jpg'
      ])
    ).resolves.toEqual({ ok: true })
    expect(runtime.invokeWorker).toHaveBeenCalledWith('workers/main.js', 'shareFiles', [
      'C:\\Users\\alice\\Desktop\\photo.jpg'
    ])
  })
})
