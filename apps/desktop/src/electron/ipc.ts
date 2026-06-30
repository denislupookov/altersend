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
import { readdir, stat } from 'fs/promises'
import path from 'path'
import { isPathSafe, type TransferMethod } from '@altersend/core'
import type { DesktopRuntime } from './runtime.js'
import { setReportingEnabled } from './sentry.js'

const pickedPaths = new Map<number, Set<string>>()

function recordPickedPath(senderId: number, p: string) {
  if (!pickedPaths.has(senderId)) pickedPaths.set(senderId, new Set())
  pickedPaths.get(senderId)!.add(p)
}

function isAllowedPath(senderId: number, filePath: string): boolean {
  const allowed = pickedPaths.get(senderId)
  if (!allowed) return false
  if (allowed.has(filePath)) return true
  for (const p of allowed) {
    if (filePath.startsWith(p + path.sep) || filePath.startsWith(p + '/')) return true
  }
  return false
}

interface PickedFile {
  path: string
  name: string
  size: number
  relativePath?: string
}

async function collectFolderFiles(
  rootDir: string,
  rootName: string = path.basename(rootDir)
): Promise<PickedFile[]> {
  const files: PickedFile[] = []
  const walk = async (absDir: string, relDir: string): Promise<void> => {
    const entries = await readdir(absDir, { withFileTypes: true })
    await Promise.all(
      entries.map(async (entry) => {
        const abs = path.join(absDir, entry.name)
        const rel = `${relDir}/${entry.name}`
        if (entry.isDirectory()) {
          await walk(abs, rel)
        } else if (entry.isFile()) {
          const fileStats = await stat(abs)
          files.push({ path: abs, name: entry.name, size: fileStats.size, relativePath: rel })
        }
      })
    )
  }
  await walk(rootDir, rootName)
  return files
}

function uniqueFolderName(base: string, used: Set<string>): string {
  let name = base
  for (let i = 2; used.has(name); i++) name = `${base} (${i})`
  used.add(name)
  return name
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

  ipcMain.handle('app:pickFiles', async (evt) => {
    const parentWindow = BrowserWindow.fromWebContents(evt.sender) ?? undefined
    const dialogOptions: OpenDialogOptions = {
      title: 'Select files or folders to share',
      properties: ['openFile', 'openDirectory', 'multiSelections']
    }
    const result = parentWindow
      ? await dialog.showOpenDialog(parentWindow, dialogOptions)
      : await dialog.showOpenDialog(dialogOptions)

    if (result.canceled || result.filePaths.length === 0) {
      return null
    }

    const id = evt.sender.id
    const usedFolderNames = new Set<string>()
    const picked: PickedFile[] = []
    for (const filePath of result.filePaths) {
      recordPickedPath(id, filePath)
      const fileStats = await stat(filePath)
      if (fileStats.isDirectory()) {
        const rootName = uniqueFolderName(path.basename(filePath), usedFolderNames)
        picked.push(...(await collectFolderFiles(filePath, rootName)))
      } else {
        picked.push({ path: filePath, name: path.basename(filePath), size: fileStats.size })
      }
    }

    return picked
  })

  // Expands a folder dropped onto the window (path resolved by the renderer via
  // webUtils.getPathForFile) into its files, preserving relative structure.
  ipcMain.handle('app:expandFolder', async (evt, dirPath: string) => {
    if (!isPathSafe(dirPath)) return []
    const dirStats = await stat(dirPath).catch(() => null)
    if (!dirStats?.isDirectory()) return []
    recordPickedPath(evt.sender.id, dirPath)
    return collectFolderFiles(dirPath)
  })

  ipcMain.handle('app:pickSaveFile', async (evt, defaultName) => {
    const parentWindow = BrowserWindow.fromWebContents(evt.sender) ?? undefined
    const dialogOptions = {
      title: 'Save received file',
      defaultPath: defaultName
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

  ipcMain.handle('app:pickDirectory', async (evt) => {
    const parentWindow = BrowserWindow.fromWebContents(evt.sender) ?? undefined
    const dialogOptions: OpenDialogOptions = {
      title: 'Choose a folder for downloaded files',
      properties: ['openDirectory', 'createDirectory']
    }
    const result = parentWindow
      ? await dialog.showOpenDialog(parentWindow, dialogOptions)
      : await dialog.showOpenDialog(dialogOptions)

    if (result.canceled || result.filePaths.length === 0) {
      return null
    }

    const directoryPath = result.filePaths[0]

    recordPickedPath(evt.sender.id, directoryPath)
    return {
      path: directoryPath,
      name: path.basename(directoryPath)
    }
  })

  ipcMain.handle('app:restart', () => {
    runtime.restartApp()
  })

  ipcMain.handle('app:clipboardReadText', () => clipboard.readText())

  ipcMain.handle('app:showInFolder', (evt, filePath: string) => {
    if (!isPathSafe(filePath)) throw new Error('Refused: path failed safety check')
    if (!isAllowedPath(evt.sender.id, filePath))
      throw new Error('Refused: path not from a user-approved dialog')
    shell.showItemInFolder(filePath)
  })

  ipcMain.handle('app:openFile', async (evt, filePath: string) => {
    if (!isPathSafe(filePath)) throw new Error('Refused: path failed safety check')
    if (!isAllowedPath(evt.sender.id, filePath))
      throw new Error('Refused: path not from a user-approved dialog')
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

  ipcMain.handle('app:requestCameraAccess', async () => {
    if (!isMac) return true
    if (systemPreferences.getMediaAccessStatus('camera') === 'granted') return true
    return systemPreferences.askForMediaAccess('camera')
  })
}
