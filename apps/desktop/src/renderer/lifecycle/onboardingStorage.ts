const KEY = 'altersend.onboarding.completed'

export function isOnboardingCompleted(): boolean {
  if (import.meta.env.VITE_FORCE_ONBOARDING === '1') return false
  try {
    return window.localStorage.getItem(KEY) === '1'
  } catch {
    return false
  }
}

export function markOnboardingCompleted(): void {
  try {
    window.localStorage.setItem(KEY, '1')
  } catch {}
}
