import type { ImageSourcePropType } from 'react-native'
import { onboardingStepKinds, type OnboardingStepKind } from '@altersend/domain'
import sendDemoPoster from '../../../../assets/onboarding/send-demo-poster.png'
import sendDemoVideo from '../../../../assets/onboarding/send-demo.mp4'
import shareScreen from '../../../../assets/onboarding/share.png'
import receiveScreen from '../../../../assets/onboarding/receive.png'
import relayScreen from '../../../../assets/onboarding/relay.png'

interface StepMedia {
  screen: ImageSourcePropType
  video?: number
}

export interface OnboardingStep extends StepMedia {
  kind: OnboardingStepKind
}

const MEDIA: Record<OnboardingStepKind, StepMedia> = {
  welcome: { screen: sendDemoPoster, video: sendDemoVideo },
  receive: { screen: receiveScreen },
  private: { screen: shareScreen },
  network: { screen: relayScreen }
}

export const onboardingSteps: OnboardingStep[] = onboardingStepKinds.map((kind) => ({
  kind,
  ...MEDIA[kind]
}))
