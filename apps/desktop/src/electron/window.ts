import { app, BrowserWindow, screen, shell } from 'electron'
import path from 'path'
import { fileURLToPath } from 'url'
import { isLinux } from 'which-runtime'
import { forgetPickedPaths } from './pathAccess.js'
import { applyThemeSource, loadThemeSource, windowBackgroundColor } from './theme.js'
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
  const minWidth = 720
  const minHeight = 480
  const { width: workAreaWidth, height: workAreaHeight } = screen.getPrimaryDisplay().workAreaSize
  const width = Math.min(980, workAreaWidth)
  const height = Math.min(792, workAreaHeight)
  applyThemeSource(await loadThemeSource())
  const win = new BrowserWindow({
    width,
    height,
    minWidth: Math.min(minWidth, width),
    minHeight: Math.min(minHeight, height),
    show: false,
    backgroundColor: windowBackgroundColor(),
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

  const senderId = win.webContents.id
  win.on('closed', () => {
    pear.updater.removeListener('updating', onUpdating)
    pear.updater.removeListener('updated', onUpdated)
    forgetPickedPaths(senderId)
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

export async function showOrCreateMainWindow(pear: PearRuntimeInstance): Promise<void> {
  const existing = BrowserWindow.getAllWindows().find((win) => !win.isDestroyed())
  if (!existing) {
    await createMainWindow(pear)
    return
  }

  if (existing.isMinimized()) existing.restore()
  existing.show()
  existing.focus()
}
