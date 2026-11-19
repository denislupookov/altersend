import { Menu, Tray, nativeImage } from 'electron'
import path from 'path'
import { fileURLToPath } from 'url'
import { createJsonStore } from './store/index.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const iconPath = path.join(__dirname, '..', '..', 'build', 'icon.png')

interface StoredSystemTray {
  enabled: boolean
}

interface SystemTrayStore {
  read(): Promise<StoredSystemTray>
  write(value: StoredSystemTray): Promise<void>
}

interface SystemTrayOptions {
  open: () => void
  quit: () => void
}

const defaultStore = createJsonStore<StoredSystemTray>('system-tray.json', { enabled: false })

export class SystemTrayController {
  private tray: Tray | null = null
  private labels: SystemTrayLabels | null = null
  private enabled = false
  private quitting = false
  private pending: Promise<unknown> = Promise.resolve()

  constructor(
    private options: SystemTrayOptions,
    private store: SystemTrayStore = defaultStore
  ) {}

  initialize(): Promise<void> {
    const operation = this.pending.then(async () => {
      try {
        this.enabled = (await this.store.read()).enabled === true
        if (this.enabled && this.labels) {
          this.activate()
          this.enabled = this.isActive()
        }
      } catch {
        console.error('Failed to restore the system tray setting')
      }
    })
    this.pending = operation.catch(() => {})
    return operation
  }

  isEnabled(): boolean {
    return this.enabled
  }

  async getEnabled(): Promise<boolean> {
    await this.pending
    return this.enabled
  }

  setLabels(labels: SystemTrayLabels): void {
    if (
      !labels ||
      ![labels.open, labels.quit, labels.tooltip].every(
        (value) =>
          typeof value === 'string' &&
          value.trim().length > 0 &&
          value.length <= 256 &&
          !/\p{Cc}/u.test(value)
      )
    ) {
      throw new Error('Invalid system tray labels')
    }
    this.labels = labels
    if (this.enabled) {
      this.activate()
      this.enabled = this.isActive()
    }
    if (this.isActive()) this.tray?.setToolTip(labels.tooltip)
    this.refreshMenu()
  }

  isActive(): boolean {
    return this.tray !== null && !this.tray.isDestroyed()
  }

  shouldHideOnClose(): boolean {
    return !this.quitting && this.isActive()
  }

  beginQuit(): void {
    this.quitting = true
  }

  refreshMenu(): void {
    if (!this.isActive() || !this.tray || !this.labels) return

    this.tray.setContextMenu(
      Menu.buildFromTemplate([
        { label: this.labels.open, click: this.options.open },
        { label: this.labels.quit, click: this.options.quit }
      ])
    )
  }

  setEnabled(enabled: boolean): Promise<boolean> {
    const operation = this.pending.then(async () => {
      if (this.quitting) throw new Error('The application is quitting')
      const wasActive = this.isActive()
      if (enabled) {
        this.activate()
        if (!this.isActive()) throw new Error('The system tray is unavailable')
      }
      try {
        await this.store.write({ enabled })
      } catch {
        if (!wasActive) {
          this.deactivate()
          if (!this.quitting) this.options.open()
        }
        throw new Error('Could not save the system tray setting')
      }
      this.enabled = enabled
      if (!enabled) {
        this.deactivate()
        if (!this.quitting) this.options.open()
      }
      return enabled
    })
    this.pending = operation.catch(() => {})
    return operation
  }

  private activate(): void {
    if (this.quitting || this.isActive() || !this.labels) return

    try {
      const image = nativeImage.createFromPath(iconPath)
      if (image.isEmpty()) throw new Error('The system tray icon could not be loaded')

      const size = process.platform === 'darwin' ? 18 : 22
      this.tray = new Tray(image.resize({ width: size, height: size }))
      this.tray.setToolTip(this.labels.tooltip)
      this.tray.on('click', this.options.open)
      this.refreshMenu()
    } catch (error) {
      console.error('Failed to enable the system tray', error)
      this.deactivate()
    }
  }

  private deactivate(): void {
    if (this.tray && !this.tray.isDestroyed()) this.tray.destroy()
    this.tray = null
  }
}
