export type SettingsSection = 'devices' | 'language' | 'feedback' | 'security' | 'about'

type Listener = (section: SettingsSection) => void

const listeners = new Set<Listener>()

export function openSettingsPanel(section: SettingsSection = 'devices'): void {
  for (const listener of listeners) listener(section)
}

export function subscribeOpenSettings(listener: Listener): () => void {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}
