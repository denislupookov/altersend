import { app, shell } from 'electron'
import fs from 'fs'
import path from 'path'

function shortcutPath(appName: string): string {
  return path.join(app.getPath('appData'), 'Microsoft', 'Windows', 'SendTo', `${appName}.lnk`)
}

function stubExecutable(): string {
  return path.resolve(path.dirname(process.execPath), '..', path.basename(process.execPath))
}

export function updateSendToShortcut(squirrelEvent: string): void {
  if (process.platform !== 'win32') return

  const appName = app.getName()
  const target = shortcutPath(appName)

  try {
    if (squirrelEvent === '--squirrel-uninstall') {
      fs.rmSync(target, { force: true })
      return
    }

    if (squirrelEvent !== '--squirrel-install' && squirrelEvent !== '--squirrel-updated') return

    fs.mkdirSync(path.dirname(target), { recursive: true })
    shell.writeShortcutLink(target, 'replace', {
      target: stubExecutable(),
      description: `Send with ${appName}`
    })
  } catch (err) {
    console.error('sendToShortcut: failed to update SendTo entry', err)
  }
}
