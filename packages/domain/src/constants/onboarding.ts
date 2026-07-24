import { privacyPolicyUrl } from './links'

export type OnboardingSlideKind = 'pairing' | 'keep-open' | 'privacy'

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
