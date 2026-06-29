export type SettingsPanelView = 'settings' | 'devices' | 'report'

type Listener = (panel: SettingsPanelView) => void

const listeners = new Set<Listener>()

export function openSettingsPanel(panel: SettingsPanelView = 'settings'): void {
  for (const listener of listeners) listener(panel)
}

export function subscribeOpenSettings(listener: Listener): () => void {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}
