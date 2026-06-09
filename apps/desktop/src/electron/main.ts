import { app } from 'electron'
import { createRequire } from 'module'
import path from 'path'
import { fileURLToPath } from 'url'
import { initSentry } from './sentry.js'
import { registerIpcHandlers } from './ipc.js'
import { createDesktopRuntime } from './runtime.js'
import { createMainWindow, sendToAllWindows } from './window.js'

const require = createRequire(import.meta.url)

function isModuleNotFoundError(err: unknown): boolean {
  if (typeof err !== 'object' || err === null || !('code' in err)) return false
  return err.code === 'MODULE_NOT_FOUND'
}

function handleSquirrelStartup(): boolean {
  if (process.platform !== 'win32') return false
  if (!process.argv.some((arg) => arg.startsWith('--squirrel-'))) return false

  try {
    return Boolean(require('electron-squirrel-startup'))
  } catch (err) {
    if (isModuleNotFoundError(err)) return false
    throw err
  }
}

if (handleSquirrelStartup()) {
  // Squirrel.Windows install/update/uninstall: shortcuts are handled at import, just quit
  app.quit()
} else {
  initSentry()

  if (!app.isPackaged && process.platform === 'darwin' && app.dock) {
    const __dirname = path.dirname(fileURLToPath(import.meta.url))
    app.dock.setIcon(path.join(__dirname, '..', '..', 'build', 'icon.png'))
  }

  const runtime = createDesktopRuntime({ broadcast: sendToAllWindows })

  registerIpcHandlers(runtime)
  app.setAsDefaultProtocolClient(runtime.metadata.protocol)

  const lock = runtime.allowMultipleInstances ? true : app.requestSingleInstanceLock()

  if (!lock) {
    app.quit()
  } else {
    app.on('open-url', (evt, url) => {
      evt.preventDefault()
      runtime.forwardDeepLink(url)
    })

    app.on('second-instance', (_evt, args) => {
      const url = args.find((arg) => arg.startsWith(runtime.metadata.protocol + '://'))
      if (url) runtime.forwardDeepLink(url)
    })

    app.whenReady().then(() => {
      createMainWindow(runtime.getPear()).catch((err) => {
        console.error('Failed to create window:', err)
        app.quit()
      })
    })

    app.on('window-all-closed', () => {
      if (process.platform !== 'darwin') {
        app.quit()
      }
    })
  }
}
