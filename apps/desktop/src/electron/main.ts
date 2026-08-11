import { app } from 'electron'
import squirrelStartup from 'electron-squirrel-startup'
import path from 'path'
import { fileURLToPath } from 'url'
import { enqueueExternalPaths, extractFilePaths, readShareManifest } from './externalFiles.js'
import { initSentry } from './sentry.js'
import { registerIpcHandlers } from './ipc.js'
import { cliArgs, createDesktopRuntime } from './runtime.js'
import { updateSendToShortcut } from './sendToShortcut.js'
import { createMainWindow, sendToAllWindows, showOrCreateMainWindow } from './window.js'

if (squirrelStartup) {
  updateSendToShortcut(process.argv[1])
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
    const appPath = app.getAppPath()

    const revealWindow = () => {
      if (!app.isReady()) return
      showOrCreateMainWindow(runtime.getPear()).catch((err) => {
        console.error('Failed to show window:', err)
      })
    }

    const takeFileArgs = (args: string[]) => {
      enqueueExternalPaths(extractFilePaths(args, runtime.metadata.protocol, appPath))
    }

    const takeDeepLink = (url: string) => {
      const shared = readShareManifest(url)
      if (shared.length === 0) {
        runtime.forwardDeepLink(url)
        return
      }
      enqueueExternalPaths(shared)
    }

    app.on('open-file', (evt, filePath) => {
      evt.preventDefault()
      enqueueExternalPaths([filePath])
      revealWindow()
    })

    app.on('open-url', (evt, url) => {
      evt.preventDefault()
      takeDeepLink(url)
      revealWindow()
    })

    app.on('second-instance', (_evt, args) => {
      const url = args.find((arg) => arg.startsWith(runtime.metadata.protocol + '://'))
      if (url) takeDeepLink(url)
      takeFileArgs(args.slice(1))
      revealWindow()
    })

    app.on('activate', revealWindow)

    app.whenReady().then(() => {
      takeFileArgs(cliArgs)
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
