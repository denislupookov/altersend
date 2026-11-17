import { onboardingStepKinds, type OnboardingStepKind } from '@altersend/domain'
import { STEP_MEDIA } from './media'
import type { StepMedia } from './types'

export interface OnboardingStep extends StepMedia {
  kind: OnboardingStepKind
}

export const onboardingSteps: OnboardingStep[] = onboardingStepKinds.map((kind) => ({
  kind,
  ...STEP_MEDIA[kind]
}))
