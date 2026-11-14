import { onboardingStepKinds, type OnboardingStepKind } from '@altersend/domain'
import desktopDemoPoster from '../../../../../../assets/onboarding/desktop-demo-poster.png'
import desktopDemoVideo from '../../../../../../assets/onboarding/desktop-demo.mp4'
import receiveDark from '../../../../../../assets/onboarding/desktop-receive-dark.png'
import receiveLight from '../../../../../../assets/onboarding/desktop-receive-light.png'
import relayDark from '../../../../../../assets/onboarding/desktop-relay-dark.png'
import relayLight from '../../../../../../assets/onboarding/desktop-relay-light.png'
import shareDark from '../../../../../../assets/onboarding/desktop-share-dark.png'
import shareLight from '../../../../../../assets/onboarding/desktop-share-light.png'

interface ThemedScreen {
  light: string
  dark: string
}

interface StepMedia {
  screen: ThemedScreen
  video?: string
}

export interface OnboardingStep extends StepMedia {
  kind: OnboardingStepKind
}

const MEDIA: Record<OnboardingStepKind, StepMedia> = {
  welcome: {
    screen: { light: desktopDemoPoster, dark: desktopDemoPoster },
    video: desktopDemoVideo
  },
  receive: { screen: { light: receiveLight, dark: receiveDark } },
  private: { screen: { light: shareLight, dark: shareDark } },
  network: { screen: { light: relayLight, dark: relayDark } }
}

export const onboardingSteps: OnboardingStep[] = onboardingStepKinds.map((kind) => ({
  kind,
  ...MEDIA[kind]
}))
