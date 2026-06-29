const { contextBridge, ipcRenderer, webUtils } = require('electron')

const P2P_WORKER = 'workers/main.js'

contextBridge.exposeInMainWorld('bridge', {
  pkg: () => ipcRenderer.sendSync('pkg'),

  startP2P: () => ipcRenderer.invoke('pear:startWorker', P2P_WORKER),
  disconnectP2P: () => ipcRenderer.invoke('pear:disconnectWorker', P2P_WORKER),
  invokeTransfer: (method, ...args) =>
    ipcRenderer.invoke('pear:worker:invoke', P2P_WORKER, method, ...args),

  onTransferEvent: (cb) => {
    const listener = (_evt, message) => cb(message)
    ipcRenderer.on('pear:worker:event:' + P2P_WORKER, listener)
    return () => ipcRenderer.removeListener('pear:worker:event:' + P2P_WORKER, listener)
  },

  pickFiles: () => ipcRenderer.invoke('app:pickFiles'),
  pickDirectory: () => ipcRenderer.invoke('app:pickDirectory'),
  pickSaveFile: (defaultName) => {
    if (typeof defaultName !== 'string' || defaultName.length === 0 || defaultName.length > 255) {
      throw new Error('pickSaveFile: defaultName must be a non-empty string up to 255 chars')
    }
    if (defaultName.includes('/') || defaultName.includes('\\') || defaultName.includes('\0')) {
      throw new Error('pickSaveFile: defaultName must not contain path separators or null bytes')
    }
    return ipcRenderer.invoke('app:pickSaveFile', defaultName)
  },
  getPathForFile: (file) => webUtils.getPathForFile(file),
  appRestart: () => ipcRenderer.invoke('app:restart'),
  showInFolder: (filePath) => ipcRenderer.invoke('app:showInFolder', filePath),
  openFile: (filePath) => ipcRenderer.invoke('app:openFile', filePath),
  openExternalUrl: (url) => {
    if (typeof url !== 'string' || !(url.startsWith('https://') || url.startsWith('mailto:'))) {
      throw new Error('openExternalUrl: only https and mailto URLs allowed')
    }
    return ipcRenderer.invoke('app:openExternalUrl', url)
  },
  onDeepLink: (cb) => {
    const listener = (_evt, url) => cb(url)
    ipcRenderer.on('app:deep-link', listener)
    return () => ipcRenderer.removeListener('app:deep-link', listener)
  },
  onRuntimeUpdated: (cb) => {
    const listener = () => cb()
    ipcRenderer.on('runtime:updated', listener)
    return () => ipcRenderer.removeListener('runtime:updated', listener)
  },
  setSentryEnabled: (enabled) => ipcRenderer.invoke('sentry:setEnabled', enabled),
  requestCameraAccess: () => ipcRenderer.invoke('app:requestCameraAccess'),
  clipboardReadText: () => ipcRenderer.invoke('app:clipboardReadText'),
})
