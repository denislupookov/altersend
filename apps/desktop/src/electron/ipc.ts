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
import { getDownloadFolder, setDownloadFolder } from './downloadLocation.js'
import type { DesktopRuntime } from './runtime.js'
import { setReportingEnabled } from './sentry.js'

const pickedPaths = new Map<number, Set<string>>()

function recordPickedPath(senderId: number, p: string) {
  if (!pickedPaths.has(senderId)) pickedPaths.set(senderId, new Set())
  pickedPaths.get(senderId)!.add(p)
}

function isUnder(filePath: string, dir: string): boolean {
  const rel = path.relative(dir, filePath)
  if (rel === '') return true
  if (path.isAbsolute(rel)) return false
  return rel !== '..' && !rel.startsWith(`..${path.sep}`)
}

async function isAllowedPath(senderId: number, filePath: string): Promise<boolean> {
  for (const p of pickedPaths.get(senderId) ?? []) {
    if (isUnder(filePath, p)) return true
  }

  const folder = await getDownloadFolder()
  return folder ? isUnder(filePath, folder) : false
}

async function assertAllowedPath(
  evt: Electron.IpcMainInvokeEvent,
  filePath: string
): Promise<void> {
  if (!isPathSafe(filePath)) throw new Error('Refused: path failed safety check')
  if (!(await isAllowedPath(evt.sender.id, filePath))) {
    throw new Error('Refused: path not from a user-approved dialog')
  }
}

interface PickedFile {
  path: string
  name: string
  size: number
  relativePath?: string
}

const FOLDER_SCAN_CONCURRENCY = 16

function createLimit(max: number) {
  let active = 0
  const queue: (() => void)[] = []
  const next = () => {
    if (active >= max) return
    const run = queue.shift()
    if (!run) return
    active++
    run()
  }

  return <T>(task: () => Promise<T>): Promise<T> =>
    new Promise<T>((resolve, reject) => {
      queue.push(() => {
        task()
          .then(resolve, reject)
          .finally(() => {
            active--
            next()
          })
      })
      next()
    })
}

async function collectFolderFiles(rootDir: string): Promise<PickedFile[]> {
  const files: PickedFile[] = []
  const limit = createLimit(FOLDER_SCAN_CONCURRENCY)
  const walk = async (absDir: string, relDir: string): Promise<void> => {
    const entries = await limit(() => readdir(absDir, { withFileTypes: true }))
    await Promise.all(
      entries.map(async (entry) => {
        const abs = path.join(absDir, entry.name)
        const rel = `${relDir}/${entry.name}`
        if (entry.isDirectory()) {
          await walk(abs, rel)
        } else if (entry.isFile()) {
          const fileStats = await limit(() => stat(abs))
          files.push({ path: abs, name: entry.name, size: fileStats.size, relativePath: rel })
        }
      })
    )
  }
  await walk(rootDir, path.basename(rootDir))
  return files
}

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
    const picked: PickedFile[] = []
    for (const filePath of result.filePaths) {
      recordPickedPath(id, filePath)
      const fileStats = await stat(filePath)
      if (fileStats.isDirectory()) {
        picked.push(...(await collectFolderFiles(filePath)))
      } else {
        picked.push({ path: filePath, name: path.basename(filePath), size: fileStats.size })
      }
    }

    return picked
  })

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

  ipcMain.handle('app:requestCameraAccess', async () => {
    if (!isMac) return true
    if (systemPreferences.getMediaAccessStatus('camera') === 'granted') return true
    return systemPreferences.askForMediaAccess('camera')
  })
}
