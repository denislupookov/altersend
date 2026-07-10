export type OnboardingSlideKind = 'pairing' | 'keep-open' | 'privacy'

export const privacyPolicyUrl = 'https://altersend.com/privacy'
export const termsOfServiceUrl = 'https://altersend.com/terms'
export const supportEmail = 'hello@altersend.com'
export const websiteUrl = 'https://altersend.com'
export const githubUrl = 'https://github.com/denislupookov/altersend'
export const discordUrl = 'https://discord.gg/R6tmrk85Vx'

export interface OnboardingSlideLink {
  url: string
}

export interface OnboardingSlide {
  kind: OnboardingSlideKind
  link?: OnboardingSlideLink
}

export const onboardingSlides: OnboardingSlide[] = [
  {
    kind: 'pairing'
  },
  {
    kind: 'keep-open'
  },
  {
    kind: 'privacy',
    link: { url: privacyPolicyUrl }
  }
]
