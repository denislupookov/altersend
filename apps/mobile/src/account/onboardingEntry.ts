export const ONBOARDING_ENTRY_PARAMS = { intro: '1' } as const

export function isOnboardingEntry(params: object | undefined): boolean {
  return Boolean(params && 'intro' in params && params.intro === ONBOARDING_ENTRY_PARAMS.intro)
}
