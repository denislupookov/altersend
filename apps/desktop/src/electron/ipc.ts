import {
  BrowserWindow,
  clipboard,
  dialog,
  ipcMain,
  shell,
  systemPreferences,
  type OpenDialogOptions
} from 'electron'
import { isMac } from 'which-runtime'
import path from 'path'
import { isPathSafe, type TransferMethod } from '@altersend/core'
import { takeQueuedExternalFiles } from './externalFiles.js'
import { expandPaths } from './fileScan.js'
import { assertAllowedPath, recordPickedPath } from './pathAccess.js'
import { openShareSettings, readShareExtensionState } from './shareExtension.js'
import {
  clearAccountCode,
  getDownloadFolder,
  readAccountCode,
  readAccountToken,
  setDownloadFolder,
  writeAccountCode,
  writeAccountToken,
  writeFileViaTemp
} from './store/index.js'
import { setThemeSource, type ThemeSource } from './theme.js'
import type { DesktopRuntime } from './runtime.js'
import { setReportingEnabled } from './sentry.js'

const PICK_PROPERTIES: Record<PickMode, OpenDialogOptions['properties']> = {
  files: ['openFile', 'multiSelections'],
  folders: ['openDirectory', 'multiSelections'],
  combined: ['openFile', 'openDirectory', 'multiSelections']
}

async function pickFolder(evt: Electron.IpcMainInvokeEvent): Promise<string | null> {
  const parentWindow = BrowserWindow.fromWebContents(evt.sender) ?? undefined
  const startDir = await getDownloadFolder()
  const dialogOptions: OpenDialogOptions = {
    title: 'Choose a folder for downloaded files',
    properties: ['openDirectory', 'createDirectory'],
    ...(startDir ? { defaultPath: startDir } : {})
  }
  const result = parentWindow
    ? await dialog.showOpenDialog(parentWindow, dialogOptions)
    : await dialog.showOpenDialog(dialogOptions)

  if (result.canceled || result.filePaths.length === 0) {
    return null
  }

  const folder = result.filePaths[0]
  recordPickedPath(evt.sender.id, folder)
  return folder
}

export function registerIpcHandlers(runtime: DesktopRuntime) {
  ipcMain.on('pkg', (evt) => {
    evt.returnValue = runtime.metadata.pkg
  })

  ipcMain.handle('pear:applyUpdate', () => runtime.getPear().updater.applyUpdate())
  ipcMain.handle('runtime:checkUpdated', () => !!runtime.getPear()?.updater?.updated)
  ipcMain.handle(
    'pear:worker:invoke',
    async (_evt, specifier: string, method: TransferMethod, ...args: unknown[]) => {
      return runtime.invokeWorker(specifier, method, ...args)
    }
  )

  ipcMain.handle('pear:startWorker', async (_evt, filename, args) => {
    return runtime.startWorker(filename, args)
  })

  ipcMain.handle('pear:disconnectWorker', (_evt, filename) => {
    return runtime.disconnectWorker(filename)
  })

  ipcMain.handle('app:pickFiles', async (evt, mode?: PickMode) => {
    const parentWindow = BrowserWindow.fromWebContents(evt.sender) ?? undefined
    const dialogOptions: OpenDialogOptions = { properties: PICK_PROPERTIES[mode ?? 'combined'] }
    const result = parentWindow
      ? await dialog.showOpenDialog(parentWindow, dialogOptions)
      : await dialog.showOpenDialog(dialogOptions)

    if (result.canceled || result.filePaths.length === 0) {
      return null
    }

    const id = evt.sender.id
    for (const filePath of result.filePaths) recordPickedPath(id, filePath)

    return expandPaths(result.filePaths)
  })

  ipcMain.handle('app:externalFilesReady', (evt) => takeQueuedExternalFiles(evt.sender))

  ipcMain.handle('app:shareExtensionState', () => readShareExtensionState())

  ipcMain.handle('app:openShareSettings', () => openShareSettings())

  ipcMain.handle('app:pickSaveFile', async (evt, defaultName: string) => {
    if (!isPathSafe(defaultName) || path.basename(defaultName) !== defaultName) {
      throw new Error('Refused: defaultName must be a bare file name')
    }
    const parentWindow = BrowserWindow.fromWebContents(evt.sender) ?? undefined
    const startDir = await getDownloadFolder()
    const dialogOptions = {
      title: 'Save received file',
      defaultPath: startDir ? path.join(startDir, defaultName) : defaultName
    }
    const result = parentWindow
      ? await dialog.showSaveDialog(parentWindow, dialogOptions)
      : await dialog.showSaveDialog(dialogOptions)

    if (result.canceled || !result.filePath) {
      return null
    }

    recordPickedPath(evt.sender.id, result.filePath)
    return {
      path: result.filePath,
      name: path.basename(result.filePath)
    }
  })

  ipcMain.handle('app:pickDirectory', (evt) => pickFolder(evt))

  ipcMain.handle('app:getDownloadFolder', () => getDownloadFolder())

  ipcMain.handle('account:getCode', () => readAccountCode())

  ipcMain.handle('account:setCode', (_evt, code: string) => {
    if (typeof code !== 'string' || !/^\d{16}$/.test(code)) {
      throw new Error('account:setCode expects a normalised 16-digit code')
    }
    return writeAccountCode(code)
  })

  ipcMain.handle('account:clearCode', () => clearAccountCode())

  ipcMain.handle('account:getToken', () => readAccountToken())

  ipcMain.handle('account:setToken', (_evt, token: unknown) => {
    if (token !== null && typeof token !== 'string') {
      throw new Error('account:setToken expects a string or null')
    }
    return writeAccountToken(token)
  })

  ipcMain.handle('account:saveCode', async (evt, contents: string, defaultName: string) => {
    if (!isPathSafe(defaultName) || path.basename(defaultName) !== defaultName) {
      throw new Error('Refused: defaultName must be a bare file name')
    }

    const parentWindow = BrowserWindow.fromWebContents(evt.sender) ?? undefined
    const startDir = await getDownloadFolder()
    const dialogOptions = {
      title: 'Save your Pro code',
      defaultPath: startDir ? path.join(startDir, defaultName) : defaultName
    }

    const result = parentWindow
      ? await dialog.showSaveDialog(parentWindow, dialogOptions)
      : await dialog.showSaveDialog(dialogOptions)

    if (result.canceled || !result.filePath) return null

    await writeFileViaTemp(result.filePath, contents)
    return result.filePath
  })

  ipcMain.handle('app:chooseDownloadFolder', async (evt) => {
    const folder = await pickFolder(evt)
    if (folder) await setDownloadFolder(folder)
    return folder
  })

  ipcMain.handle('app:restart', () => {
    runtime.restartApp()
  })

  ipcMain.handle('app:clipboardReadText', () => clipboard.readText())

  ipcMain.handle('app:showInFolder', async (evt, filePath: string) => {
    await assertAllowedPath(evt, filePath)
    shell.showItemInFolder(filePath)
  })

  ipcMain.handle('app:openFile', async (evt, filePath: string) => {
    await assertAllowedPath(evt, filePath)
    return shell.openPath(filePath)
  })

  ipcMain.handle('app:openExternalUrl', async (_evt, url: string) => {
    if (typeof url !== 'string' || !(url.startsWith('https://') || url.startsWith('mailto:'))) {
      throw new Error('Refused: only https:// and mailto: URLs allowed')
    }
    return shell.openExternal(url)
  })

  ipcMain.handle('sentry:setEnabled', (_evt, enabled: boolean) => {
    setReportingEnabled(enabled)
  })

  ipcMain.handle('theme:setPreference', (_evt, preference: ThemeSource) =>
    setThemeSource(preference)
  )

  ipcMain.handle('app:requestCameraAccess', async () => {
    if (!isMac) return true
    if (systemPreferences.getMediaAccessStatus('camera') === 'granted') return true
    return systemPreferences.askForMediaAccess('camera')
  })
}
