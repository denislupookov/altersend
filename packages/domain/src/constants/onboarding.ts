import { privacyPolicyUrl } from './links'

export type OnboardingSlideKind = 'privacy' | 'pair' | 'link'

export interface OnboardingSlideLink {
  url: string
}

export interface OnboardingSlide {
  kind: OnboardingSlideKind
  link?: OnboardingSlideLink
}

export const onboardingSlides: OnboardingSlide[] = [
  {
    kind: 'privacy'
  },
  {
    kind: 'pair'
  },
  {
    kind: 'link',
    link: { url: privacyPolicyUrl }
  }
]
