import { app, BrowserWindow, shell } from 'electron'
import path from 'path'
import { fileURLToPath } from 'url'
import { isLinux } from 'which-runtime'
import { rawTokens } from '@altersend/components/theme/raw'
import type { PearRuntimeInstance } from './runtime.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

export function sendToAllWindows(name: string, data: unknown) {
  for (const win of BrowserWindow.getAllWindows()) {
    if (!win.isDestroyed()) win.webContents.send(name, data)
  }
}

export async function createMainWindow(pear: PearRuntimeInstance) {
  const shouldOpenDevTools = false
  const win = new BrowserWindow({
    width: 980,
    height: 792,
    minWidth: 980,
    minHeight: 792,
    show: false,
    backgroundColor: rawTokens.colors.dark.colorBackground,
    titleBarStyle: 'hiddenInset',
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      sandbox: !isLinux,
      nodeIntegration: false,
      contextIsolation: true
    }
  })

  const allowedPermissions = new Set(['media', 'clipboard-sanitized-write'])
  const { session } = win.webContents
  session.setPermissionRequestHandler((_wc, permission, callback) =>
    callback(allowedPermissions.has(permission))
  )
  session.setPermissionCheckHandler((_wc, permission) => allowedPermissions.has(permission))

  const showWindow = () => {
    if (!win.isDestroyed() && !win.isVisible()) win.show()
  }
  win.once('ready-to-show', showWindow)
  win.webContents.once('did-finish-load', showWindow)
  const showFallback = setTimeout(showWindow, 4000)
  win.once('show', () => clearTimeout(showFallback))

  win.webContents.on('did-fail-load', (_e, code, desc, url) => {
    console.error(`renderer did-fail-load: ${code} ${desc} ${url}`)
    showWindow()
  })
  win.webContents.on('render-process-gone', (_e, details) => {
    console.error(`renderer process gone: ${details.reason} (exitCode ${details.exitCode})`)
  })
  win.webContents.on('preload-error', (_e, p, err) => {
    console.error(`preload error in ${p}:`, err)
  })

  win.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('https:') || url.startsWith('mailto:')) {
      void shell.openExternal(url)
    }
    return { action: 'deny' }
  })

  const onUpdating = () => {
    if (!win.isDestroyed()) win.webContents.send('pear:event:updating')
  }

  const onUpdated = () => {
    if (!win.isDestroyed()) win.webContents.send('pear:event:updated')
  }

  pear.updater.on('updating', onUpdating)
  pear.updater.on('updated', onUpdated)

  win.on('closed', () => {
    pear.updater.removeListener('updating', onUpdating)
    pear.updater.removeListener('updated', onUpdated)
  })

  const devServerUrl = !app.isPackaged ? process.env.PEAR_DEV_SERVER_URL : undefined
  if (devServerUrl) {
    await win.loadURL(devServerUrl)
    if (shouldOpenDevTools) win.webContents.openDevTools({ mode: 'detach' })
    return win
  }

  const indexHtml = path.join(__dirname, '..', 'renderer', 'index.html')
  try {
    await win.loadFile(indexHtml)
  } catch (err) {
    console.error(`loadFile failed for ${indexHtml}:`, err)
  }
  showWindow()
  if (shouldOpenDevTools) win.webContents.openDevTools({ mode: 'detach' })

  return win
}
